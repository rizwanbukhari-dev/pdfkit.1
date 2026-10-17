/**
 * PDFKit Serverless Email Endpoint (Vercel Compatible)
 * Safely dispatches contact form messages directly to the owner inbox via Resend.
 * Includes rate limiting, honeypot spam protection, and payload validation.
 */

// In-memory sliding window rate limiter
const ipRateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 5;

// Clean stale rate limit entries periodically
function cleanupRateLimits() {
  const now = Date.now();
  for (const [ip, timestamps] of ipRateLimitMap.entries()) {
    const valid = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (valid.length === 0) {
      ipRateLimitMap.delete(ip);
    } else {
      ipRateLimitMap.set(ip, valid);
    }
  }
}

function isRateLimited(ip) {
  cleanupRateLimits();
  const now = Date.now();
  const timestamps = ipRateLimitMap.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  recent.push(now);
  ipRateLimitMap.set(ip, recent);
  return false;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export default async function handler(req, res) {
  // CORS & Allowed Methods
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed. Only POST requests are accepted.',
    });
  }

  // Parse Body
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ success: false, error: 'Malformed JSON payload.' });
    }
  }

  if (!body || typeof body !== 'object') {
    return res.status(400).json({ success: false, error: 'Request body is required.' });
  }

  // Honeypot spam check (bots will fill this invisible field)
  if (body.website || body._gotcha) {
    console.log('[PDFKit Contact] Honeypot triggered, silently ignoring bot submission.');
    return res.status(200).json({
      success: true,
      message: 'Thank you! Your message has been received.',
    });
  }

  // Rate Limiting per IP
  const clientIp =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown';

  if (isRateLimited(clientIp)) {
    return res.status(429).json({
      success: false,
      error: 'Too many messages sent. Please wait a few minutes before trying again.',
    });
  }

  // Field extraction & sanitization
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  // Validation
  if (!name || name.length < 2 || name.length > 100) {
    return res.status(400).json({
      success: false,
      error: 'Please enter a valid name (between 2 and 100 characters).',
    });
  }

  if (!email || email.length > 254 || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'Please enter a valid email address.',
    });
  }

  if (!subject || subject.length < 2 || subject.length > 150) {
    return res.status(400).json({
      success: false,
      error: 'Please enter a subject (between 2 and 150 characters).',
    });
  }

  if (!message || message.length < 10 || message.length > 5000) {
    return res.status(400).json({
      success: false,
      error: 'Please enter a message (between 10 and 5000 characters).',
    });
  }

  // Environment credentials check
  const resendApiKey = process.env.RESEND_API_KEY;
  const receiverEmail = process.env.CONTACT_RECEIVER_EMAIL || 'rizwanbukhari.dev@gmail.com';
  const senderEmail = process.env.CONTACT_SENDER_EMAIL || 'PDFKit Contact <onboarding@resend.dev>';

  if (!resendApiKey) {
    console.warn('[PDFKit Contact] RESEND_API_KEY is not configured in environment variables.');
    return res.status(503).json({
      success: false,
      error:
        'The email delivery service is currently not configured. Please set the RESEND_API_KEY environment variable in your Vercel project settings.',
    });
  }

  // Construct Email Content
  const sentDate = new Date().toUTCString();
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br />');

  const textContent = `
New Contact Message from PDFKit
----------------------------------------
Visitor Name: ${name}
Email Address: ${email}
Subject: ${subject}
Date: ${sentDate}
Client IP: ${clientIp}

Message:
${message}

----------------------------------------
Reply directly to this email to respond to ${name}.
Sent via PDFKit (https://pdfkit-1.vercel.app)
`.trim();

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New PDFKit Contact Message</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 28px; text-align: left;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">PDFKit</h1>
              <p style="color: #e0e7ff; margin: 4px 0 0 0; font-size: 13px;">New Contact / Feedback Inquiry</p>
            </td>
          </tr>

          <!-- Sender Details Card -->
          <tr>
            <td style="padding: 24px 28px 12px 28px;">
              <table width="100%" style="background-color: #f1f5f9; border-radius: 12px; padding: 16px; border: 1px solid #e2e8f0;">
                <tr>
                  <td style="font-size: 13px; color: #64748b; padding-bottom: 6px;">From:</td>
                  <td style="font-size: 14px; font-weight: 700; color: #0f172a; padding-bottom: 6px;">${safeName}</td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #64748b; padding-bottom: 6px;">Email:</td>
                  <td style="font-size: 14px; font-weight: 600; color: #4f46e5; padding-bottom: 6px;">
                    <a href="mailto:${safeEmail}" style="color: #4f46e5; text-decoration: none;">${safeEmail}</a>
                  </td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #64748b; padding-bottom: 6px;">Subject:</td>
                  <td style="font-size: 14px; font-weight: 600; color: #0f172a; padding-bottom: 6px;">${safeSubject}</td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #64748b;">Received:</td>
                  <td style="font-size: 12px; color: #64748b;">${sentDate}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Message Body -->
          <tr>
            <td style="padding: 16px 28px 24px 28px;">
              <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.5px;">Message</h3>
              <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; font-size: 14px; line-height: 1.6; color: #1e293b;">
                ${safeMessage}
              </div>
            </td>
          </tr>

          <!-- Quick Action -->
          <tr>
            <td style="padding: 0 28px 28px 28px; text-align: center;">
              <a href="mailto:${safeEmail}?subject=Re: ${encodeURIComponent(subject)}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 24px; font-size: 13px; font-weight: 600; border-radius: 10px; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);">
                Reply to ${safeName}
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 28px; text-align: center; font-size: 11px; color: #94a3b8;">
              This notification was generated automatically by PDFKit Contact Service. Client IP: ${clientIp}.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();

  // Dispatch Email via Resend REST API
  try {
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: senderEmail,
        to: [receiverEmail],
        reply_to: `${name} <${email}>`,
        subject: `[PDFKit Contact] ${subject}`,
        text: textContent,
        html: htmlContent,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('[PDFKit Contact] Resend API error response:', resendData);
      return res.status(resendResponse.status).json({
        success: false,
        error:
          resendData.message ||
          'Failed to deliver message via email provider. Please verify your sender domain configuration.',
      });
    }

    console.log('[PDFKit Contact] Email sent successfully. Message ID:', resendData.id);
    return res.status(200).json({
      success: true,
      message: 'Your message has been delivered directly to our inbox. We will get back to you soon!',
      id: resendData.id,
    });
  } catch (error) {
    console.error('[PDFKit Contact] Unexpected server dispatch error:', error);
    return res.status(500).json({
      success: false,
      error: 'An unexpected internal error occurred while dispatching your message. Please try again.',
    });
  }
}
