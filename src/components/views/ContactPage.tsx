import React, { useState, useRef } from 'react';
import {
  Sparkles,
  ExternalLink,
  Check,
  Copy,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Mail,
  User,
  MessageSquare,
  ShieldCheck,
  Clock,
  Paperclip,
  X,
  FileText,
  Info,
} from 'lucide-react';
import { DeveloperWatermark } from '../common/DeveloperWatermark';
import { WhatsAppIcon } from '../common/SocialIcons';

interface FormState {
  name: string;
  email: string;
  subject: string;
  message: string;
  website: string; // Honeypot field for bot spam detection
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  attachment?: string;
}

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// Web3Forms attachment limits: Single file upload up to 5 MB on supported plans
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.png', '.jpg', '.jpeg', '.webp'];

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState<FormState>({
    name: '',
    email: '',
    subject: '',
    message: '',
    website: '',
  });

  const [attachment, setAttachment] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const contactEmail = 'rizwanbukhari.dev@gmail.com';
  const contactPhone = '6005320065';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(contactEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(contactPhone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear field-specific validation error on change
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      return `File is too large (${sizeMb} MB). Maximum allowed size is 5 MB.`;
    }

    const extMatch = file.name.match(/\.[^.]+$/);
    const ext = extMatch ? extMatch[0].toLowerCase() : '';
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `Unsupported file format (${ext || 'unknown'}). Allowed: PDF, DOC, DOCX, TXT, PNG, JPG, WEBP.`;
    }

    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    if (!selectedFile) {
      return;
    }

    const fileError = validateFile(selectedFile);
    if (fileError) {
      setFormErrors((prev) => ({ ...prev, attachment: fileError }));
      setAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setAttachment(selectedFile);
    if (formErrors.attachment) {
      setFormErrors((prev) => ({ ...prev, attachment: undefined }));
    }
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (formErrors.attachment) {
      setFormErrors((prev) => ({ ...prev, attachment: undefined }));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (status !== 'submitting') {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (status === 'submitting') return;

    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;

    const fileError = validateFile(droppedFile);
    if (fileError) {
      setFormErrors((prev) => ({ ...prev, attachment: fileError }));
      setAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setAttachment(droppedFile);
    if (formErrors.attachment) {
      setFormErrors((prev) => ({ ...prev, attachment: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errors.name = 'Please enter your name (at least 2 characters).';
    } else if (formData.name.trim().length > 100) {
      errors.name = 'Name must not exceed 100 characters.';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!EMAIL_REGEX.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address.';
    } else if (formData.email.trim().length > 254) {
      errors.email = 'Email address is too long.';
    }

    if (!formData.subject.trim() || formData.subject.trim().length < 2) {
      errors.subject = 'Please enter a subject (at least 2 characters).';
    } else if (formData.subject.trim().length > 150) {
      errors.subject = 'Subject must not exceed 150 characters.';
    }

    if (!formData.message.trim() || formData.message.trim().length < 10) {
      errors.message = 'Please describe your inquiry or feedback (at least 10 characters).';
    } else if (formData.message.trim().length > 5000) {
      errors.message = 'Message must not exceed 5000 characters.';
    }

    if (attachment) {
      const fileError = validateFile(attachment);
      if (fileError) {
        errors.attachment = fileError;
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent duplicate submissions while in progress
    if (status === 'submitting') {
      return;
    }

    if (!validateForm()) {
      return;
    }

    // Access key configuration check
    const accessKey = (import.meta.env.VITE_WEB3FORMS_ACCESS_KEY || '').trim();

    if (!accessKey) {
      setStatus('error');
      setStatusMessage(
        'Web3Forms access key is not configured. Please add VITE_WEB3FORMS_ACCESS_KEY to your .env.local file (for local development) or Vercel Environment Variables (for production).'
      );
      return;
    }

    setStatus('submitting');
    setStatusMessage('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('access_key', accessKey);
      formDataToSend.append('name', formData.name.trim());
      formDataToSend.append('email', formData.email.trim());
      formDataToSend.append('subject', formData.subject.trim() || 'New Contact Message from PDFKit');
      formDataToSend.append('message', formData.message.trim());
      formDataToSend.append('from_name', 'PDFKit Contact Form');

      // Honeypot spam check - if filled by automated bots, tell Web3Forms to flag
      if (formData.website) {
        formDataToSend.append('botcheck', formData.website);
      }

      // Append optional file attachment if provided
      if (attachment) {
        formDataToSend.append('attachment', attachment);
      }

      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: formDataToSend,
      });

      const result = await response.json().catch(() => null);

      if (response.ok && result?.success) {
        setStatus('success');
        setStatusMessage(
          result.message ||
            'Your message has been delivered directly to our inbox. We will get back to you soon!'
        );
        // Reset form inputs only upon confirmed success
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
          website: '',
        });
        setAttachment(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setFormErrors({});
      } else {
        setStatus('error');
        const errorText =
          result?.message ||
          result?.error?.message ||
          (response.status === 403
            ? 'The Web3Forms access key is invalid or restricted. Please verify your access key.'
            : `Failed to submit message (HTTP ${response.status}). Please try again or reach out on WhatsApp.`);

        // Detect if attachment caused the failure due to Web3Forms plan restrictions
        const lowerError = errorText.toLowerCase();
        if (
          attachment &&
          (lowerError.includes('pro') ||
            lowerError.includes('attachment') ||
            lowerError.includes('file') ||
            lowerError.includes('upload') ||
            lowerError.includes('plan'))
        ) {
          setStatusMessage(
            `${errorText} Note: File attachments require an active Web3Forms Pro subscription. If using the Free plan, remove the attachment and send your message, or include a file share link.`
          );
        } else {
          setStatusMessage(errorText);
        }
      }
    } catch (err) {
      console.error('[PDFKit Web3Forms Error]', err);
      setStatus('error');
      setStatusMessage(
        'A network connection error occurred while submitting your message. Please check your internet connection or use WhatsApp.'
      );
    }
  };

  return (
    <div className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-10 sm:space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/70 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Get in Touch</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Contact & Community
        </h1>

        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          Have an idea for a new tool, found a bug, or want to collaborate? Send a message directly to my email inbox.
        </p>
      </div>

      {/* Developer Watermark & Separated Social Cards */}
      <DeveloperWatermark variant="banner" />

      {/* Direct WhatsApp Card */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 dark:border-emerald-500/30 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
            <WhatsAppIcon className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                Direct WhatsApp
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Instant replies</span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-1">
              Chat on WhatsApp
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-mono mt-0.5">
              +91 6005320065
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleCopyPhone}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedPhone ? 'Number Copied!' : 'Copy 6005320065'}</span>
          </button>

          <a
            href="https://wa.me/916005320065"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/25 transition-all hover:scale-102"
          >
            <WhatsAppIcon className="w-4 h-4" />
            <span>Open WhatsApp Chat</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Direct Email Contact Form (Delivers directly to Inbox) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft space-y-6">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <span>Direct Inbox Message</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Fill out the form below. Messages are sent securely in the background directly to our inbox without opening any external mail app.
          </p>
        </div>

        {/* Missing API Key Guidance Banner (Shown when access key is not configured) */}
        {!import.meta.env.VITE_WEB3FORMS_ACCESS_KEY && (
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-amber-900 dark:text-amber-100">
                Web3Forms Access Key Required
              </p>
              <p className="text-amber-700 dark:text-amber-300">
                Please set <code className="font-mono text-[11px] px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 font-bold">VITE_WEB3FORMS_ACCESS_KEY</code> in your <code className="font-mono text-[11px]">.env.local</code> file or Vercel Environment Variables to activate form submissions.
              </p>
            </div>
          </div>
        )}

        {/* Success Alert Banner */}
        {status === 'success' && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 animate-in fade-in duration-200 space-y-2">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                  Message Sent Successfully!
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                  {statusMessage}
                </p>
              </div>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setStatus('idle')}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                Send Another Message
              </button>
            </div>
          </div>
        )}

        {/* Error Alert Banner */}
        {status === 'error' && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 animate-in fade-in duration-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                Failed to Send Message
              </h4>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                {statusMessage}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Honeypot anti-spam field (hidden from legitimate visitors) */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="website">Leave this field blank</label>
            <input
              type="text"
              id="website"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              tabIndex={-1}
              autoComplete="off"
            />
            <input
              type="checkbox"
              name="botcheck"
              id="botcheck"
              className="hidden"
              style={{ display: 'none' }}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          {/* Name & Email Fields in Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="name"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Your Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="name"
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Alex Johnson"
                  disabled={status === 'submitting'}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${
                    formErrors.name
                      ? 'border-rose-300 dark:border-rose-700 focus:ring-rose-500 bg-rose-50/30'
                      : 'border-slate-200 dark:border-slate-700 focus:ring-brand-500 bg-slate-50 dark:bg-slate-800'
                  } text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 transition-colors disabled:opacity-60`}
                />
              </div>
              {formErrors.name && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                  {formErrors.name}
                </p>
              )}
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Your Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="e.g. alex@example.com"
                  disabled={status === 'submitting'}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${
                    formErrors.email
                      ? 'border-rose-300 dark:border-rose-700 focus:ring-rose-500 bg-rose-50/30'
                      : 'border-slate-200 dark:border-slate-700 focus:ring-brand-500 bg-slate-50 dark:bg-slate-800'
                  } text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 transition-colors disabled:opacity-60`}
                />
              </div>
              {formErrors.email && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                  {formErrors.email}
                </p>
              )}
            </div>
          </div>

          {/* Subject Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="subject"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Subject <span className="text-rose-500">*</span>
            </label>
            <input
              id="subject"
              type="text"
              name="subject"
              required
              value={formData.subject}
              onChange={handleInputChange}
              placeholder="e.g. Feature suggestion: Batch OCR or custom watermark support"
              disabled={status === 'submitting'}
              className={`w-full px-4 py-2.5 rounded-xl border ${
                formErrors.subject
                  ? 'border-rose-300 dark:border-rose-700 focus:ring-rose-500 bg-rose-50/30'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-brand-500 bg-slate-50 dark:bg-slate-800'
              } text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 transition-colors disabled:opacity-60`}
            />
            {formErrors.subject && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                {formErrors.subject}
              </p>
            )}
          </div>

          {/* Message Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="message"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Message <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <textarea
                id="message"
                name="message"
                rows={5}
                required
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Describe your suggestion, feedback, question, or bug report..."
                disabled={status === 'submitting'}
                className={`w-full p-4 rounded-xl border ${
                  formErrors.message
                    ? 'border-rose-300 dark:border-rose-700 focus:ring-rose-500 bg-rose-50/30'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-brand-500 bg-slate-50 dark:bg-slate-800'
                } text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 transition-colors disabled:opacity-60 resize-y`}
              />
            </div>
            {formErrors.message && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                {formErrors.message}
              </p>
            )}
          </div>

          {/* Optional File Attachment */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="attachment"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Attachment <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Max 5 MB
              </span>
            </div>

            {!attachment ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                role="button"
                tabIndex={status === 'submitting' ? -1 : 0}
                aria-label="Upload file attachment"
                className={`border-2 border-dashed ${
                  formErrors.attachment
                    ? 'border-rose-300 dark:border-rose-700 bg-rose-50/20'
                    : isDragging
                    ? 'border-brand-500 bg-brand-50/30 dark:bg-brand-950/30'
                    : 'border-slate-300 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-500 bg-slate-50/60 dark:bg-slate-800/60'
                } rounded-xl p-4 text-center cursor-pointer transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500 group ${
                  status === 'submitting' ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''
                }`}
              >
                <input
                  ref={fileInputRef}
                  id="attachment"
                  type="file"
                  name="attachment"
                  onChange={handleFileChange}
                  disabled={status === 'submitting'}
                  accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp,application/pdf,image/*"
                  className="hidden"
                  aria-describedby="attachment-hint"
                />
                <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                  <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-700/80 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 group-hover:bg-brand-50 dark:group-hover:bg-brand-950/60 transition-colors">
                    <Paperclip className="w-4 h-4" />
                  </div>
                  <div className="text-xs text-slate-700 dark:text-slate-200 font-medium">
                    <span className="text-brand-600 dark:text-brand-400 font-semibold underline underline-offset-2">
                      Click to upload
                    </span>{' '}
                    or drag & drop
                  </div>
                  <p id="attachment-hint" className="text-[11px] text-slate-500 dark:text-slate-400">
                    PDF, DOC, DOCX, TXT, PNG, or JPG (up to 5 MB)
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {attachment.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {attachment.size >= 1024 * 1024
                        ? `${(attachment.size / (1024 * 1024)).toFixed(2)} MB`
                        : `${(attachment.size / 1024).toFixed(1)} KB`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveAttachment}
                  disabled={status === 'submitting'}
                  aria-label="Remove attached file"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors shrink-0 disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {formErrors.attachment && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                {formErrors.attachment}
              </p>
            )}

            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 pt-0.5">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Receiving email attachments requires an active Web3Forms Pro subscription.</span>
            </p>
          </div>

          {/* Trust Guarantees */}
          <div className="flex flex-wrap items-center gap-4 py-1 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Direct delivery to owner</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-brand-500 shrink-0" />
              <span>Replies sent directly to your email</span>
            </span>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <button
              type="button"
              onClick={handleCopyEmail}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium transition-colors"
            >
              {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedEmail ? 'Email Copied!' : `Or manual copy: ${contactEmail}`}</span>
            </button>

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-md shadow-brand-500/20"
            >
              {status === 'submitting' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Sending Message...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Message</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
