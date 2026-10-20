/**
 * Contact Form validation, payload construction, and error parsing utilities.
 * Encapsulates Web3Forms integration logic according to official specifications.
 */

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  website?: string;
}

export interface ContactFormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  attachment?: string;
}

export interface Web3FormsSubmitParams {
  accessKey: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  attachment?: File | null;
  isBot?: boolean;
}

export interface ParsedApiError {
  message: string;
  isAttachmentPlanError: boolean;
}

export const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// Web3Forms attachment limits: Single file upload up to 5 MB on supported plans
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.png', '.jpg', '.jpeg', '.webp'];

/**
 * Checks whether an access key has been properly configured by the user,
 * ignoring empty strings and documentation template placeholders.
 */
export const isAccessKeyConfigured = (key?: string | null): boolean => {
  if (!key) return false;
  const trimmed = key.trim();
  return (
    trimmed.length > 0 &&
    trimmed !== 'your_web3forms_access_key_here' &&
    trimmed !== 'YOUR_WEB3FORMS_ACCESS_KEY' &&
    trimmed !== 'YOUR_ACCESS_KEY_HERE'
  );
};

/**
 * Validates a file attachment against size and extension limits.
 */
export const validateFile = (file: { name: string; size: number }): string | null => {
  if (file.size === 0) {
    return 'The selected file is empty (0 bytes). Please select a valid file.';
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return `File is too large (${sizeMb} MB). Maximum allowed size is 5 MB.`;
  }

  const extMatch = file.name.match(/\.[^.]+$/);
  const ext = extMatch ? extMatch[0].toLowerCase() : '';
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return `Unsupported file format (${ext || 'unknown'}). Allowed: PDF, DOC, DOCX, TXT, PNG, JPG, JPEG, WEBP.`;
  }

  return null;
};

/**
 * Validates all contact form fields and the optional attachment.
 */
export const validateContactForm = (
  formData: ContactFormData,
  attachment?: { name: string; size: number } | null
): ContactFormErrors => {
  const errors: ContactFormErrors = {};

  const trimmedName = formData.name.trim();
  if (!trimmedName || trimmedName.length < 2) {
    errors.name = 'Please enter your name (at least 2 characters).';
  } else if (trimmedName.length > 100) {
    errors.name = 'Name must not exceed 100 characters.';
  }

  const trimmedEmail = formData.email.trim();
  if (!trimmedEmail) {
    errors.email = 'Email address is required.';
  } else if (!EMAIL_REGEX.test(trimmedEmail)) {
    errors.email = 'Please enter a valid email address.';
  } else if (trimmedEmail.length > 254) {
    errors.email = 'Email address is too long.';
  }

  const trimmedSubject = formData.subject.trim();
  if (!trimmedSubject || trimmedSubject.length < 2) {
    errors.subject = 'Please enter a subject (at least 2 characters).';
  } else if (trimmedSubject.length > 150) {
    errors.subject = 'Subject must not exceed 150 characters.';
  }

  const trimmedMessage = formData.message.trim();
  if (!trimmedMessage || trimmedMessage.length < 10) {
    errors.message = 'Please describe your inquiry or feedback (at least 10 characters).';
  } else if (trimmedMessage.length > 5000) {
    errors.message = 'Message must not exceed 5000 characters.';
  }

  if (attachment) {
    const fileError = validateFile(attachment);
    if (fileError) {
      errors.attachment = fileError;
    }
  }

  return errors;
};

/**
 * Builds the FormData payload for the Web3Forms submit API.
 * Maps email to replyto, adds botcheck if bot detected, and attaches optional file.
 */
export const buildWeb3FormsPayload = (params: Web3FormsSubmitParams): FormData => {
  const formData = new FormData();
  formData.append('access_key', params.accessKey.trim());
  formData.append('name', params.name.trim());
  formData.append('email', params.email.trim());
  formData.append('replyto', params.email.trim());
  formData.append('subject', params.subject.trim() || 'New Contact Message from PDFKit');
  formData.append('message', params.message.trim());
  formData.append('from_name', 'PDFKit Contact Form');

  if (params.isBot) {
    formData.append('botcheck', '1');
  }

  if (params.attachment) {
    formData.append('attachment', params.attachment);
  }

  return formData;
};

/**
 * Parses API error response from Web3Forms, detecting plan limitations (e.g. Pro required for attachments).
 */
export const parseWeb3FormsError = (
  status: number,
  result: Record<string, unknown> | null | undefined,
  hasAttachment: boolean
): ParsedApiError => {
  const bodyObj = (result && typeof result.body === 'object' ? result.body : null) as Record<string, unknown> | null;
  const errorObj = (result && typeof result.error === 'object' ? result.error : null) as Record<string, unknown> | null;

  const rawError =
    (typeof result?.message === 'string' ? result.message : null) ||
    (typeof bodyObj?.message === 'string' ? bodyObj.message : null) ||
    (typeof errorObj?.message === 'string' ? errorObj.message : null) ||
    (typeof result?.error === 'string' ? result.error : null) ||
    '';

  let statusDescription = rawError;
  if (!statusDescription) {
    if (status === 403) {
      statusDescription = 'The Web3Forms access key is invalid or restricted. Please verify your access key.';
    } else if (status === 429) {
      statusDescription = 'Too many message submissions. Please wait a few minutes before trying again.';
    } else {
      statusDescription = `Failed to submit message (HTTP ${status}). Please try again or reach out on WhatsApp.`;
    }
  }

  const lower = (rawError || statusDescription).toLowerCase();
  const isAttachmentPlanError =
    hasAttachment &&
    (lower.includes('pro') ||
      lower.includes('attachment') ||
      lower.includes('file') ||
      lower.includes('upload') ||
      lower.includes('plan'));

  if (isAttachmentPlanError) {
    return {
      message:
        'Attachment delivery is unavailable: Web3Forms requires an active Pro subscription to receive email attachments. Please remove the attachment and send your message (you can paste a file link in your message), or contact directly on WhatsApp.',
      isAttachmentPlanError: true,
    };
  }

  return {
    message: statusDescription,
    isAttachmentPlanError: false,
  };
};
