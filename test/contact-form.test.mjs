import test from 'node:test';
import assert from 'node:assert/strict';

// Import contactForm utilities
import {
  isAccessKeyConfigured,
  validateFile,
  validateContactForm,
  buildWeb3FormsPayload,
  parseWeb3FormsError,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_EXTENSIONS,
} from '../src/utils/contactForm.ts';

test('isAccessKeyConfigured - rejects missing or placeholder keys', () => {
  assert.equal(isAccessKeyConfigured(undefined), false);
  assert.equal(isAccessKeyConfigured(null), false);
  assert.equal(isAccessKeyConfigured(''), false);
  assert.equal(isAccessKeyConfigured('   '), false);
  assert.equal(isAccessKeyConfigured('your_web3forms_access_key_here'), false);
  assert.equal(isAccessKeyConfigured('YOUR_WEB3FORMS_ACCESS_KEY'), false);
  assert.equal(isAccessKeyConfigured('YOUR_ACCESS_KEY_HERE'), false);
});

test('isAccessKeyConfigured - accepts legitimate access keys', () => {
  assert.equal(isAccessKeyConfigured('a1b2c3d4-e5f6-7890-abcd-ef1234567890'), true);
  assert.equal(isAccessKeyConfigured('  valid-key-uuid-12345  '), true);
});

test('validateFile - enforces size limits and file extensions', () => {
  // Empty file (0 bytes)
  const emptyFile = { name: 'document.pdf', size: 0 };
  assert.match(validateFile(emptyFile), /empty/i);

  // File exceeding 5 MB
  const oversizedFile = { name: 'document.pdf', size: MAX_FILE_SIZE_BYTES + 1 };
  assert.match(validateFile(oversizedFile), /too large/i);

  // Disallowed extension
  const exeFile = { name: 'malicious.exe', size: 1024 };
  assert.match(validateFile(exeFile), /unsupported/i);

  // Allowed extensions pass
  for (const ext of ALLOWED_EXTENSIONS) {
    const validFile = { name: `sample${ext}`, size: 1024 * 50 };
    assert.equal(validateFile(validFile), null, `Extension ${ext} should be valid`);
  }

  // Case insensitive extension handling
  const upperCaseFile = { name: 'PHOTO.PNG', size: 2048 };
  assert.equal(validateFile(upperCaseFile), null);
});

test('validateContactForm - catches invalid input fields', () => {
  const invalidEmpty = {
    name: '',
    email: '',
    subject: '',
    message: '',
  };
  const errors = validateContactForm(invalidEmpty);
  assert.ok(errors.name, 'Name should be required');
  assert.ok(errors.email, 'Email should be required');
  assert.ok(errors.subject, 'Subject should be required');
  assert.ok(errors.message, 'Message should be required');

  // Invalid email format
  const badEmail = validateContactForm({
    name: 'John Doe',
    email: 'not-an-email',
    subject: 'Feedback',
    message: 'This is a test message that is long enough.',
  });
  assert.match(badEmail.email, /valid email/i);

  // Short message
  const shortMsg = validateContactForm({
    name: 'John Doe',
    email: 'john@example.com',
    subject: 'Feedback',
    message: 'Too short',
  });
  assert.match(shortMsg.message, /at least 10 characters/i);
});

test('validateContactForm - passes on complete and valid data', () => {
  const validData = {
    name: 'Jane Smith',
    email: 'jane@example.com',
    subject: 'Feature Inquiry',
    message: 'Hello PDFKit team, I really like your application and would like to give feedback.',
  };
  const errors = validateContactForm(validData);
  assert.deepEqual(errors, {});
});

test('buildWeb3FormsPayload - correctly structures form payload', () => {
  const payload = buildWeb3FormsPayload({
    accessKey: 'test-key-123',
    name: 'Jane Smith',
    email: 'jane@example.com',
    subject: 'Inquiry',
    message: 'Hello world, this is a test inquiry.',
    isBot: false,
  });

  assert.equal(payload.get('access_key'), 'test-key-123');
  assert.equal(payload.get('name'), 'Jane Smith');
  assert.equal(payload.get('email'), 'jane@example.com');
  assert.equal(payload.get('replyto'), 'jane@example.com');
  assert.equal(payload.get('subject'), 'Inquiry');
  assert.equal(payload.get('message'), 'Hello world, this is a test inquiry.');
  assert.equal(payload.get('from_name'), 'PDFKit Contact Form');
  assert.equal(payload.get('botcheck'), null); // Legitimate user: botcheck not appended

  // Bot honeypot test
  const botPayload = buildWeb3FormsPayload({
    accessKey: 'test-key-123',
    name: 'Spam Bot',
    email: 'bot@spam.com',
    subject: 'Spam',
    message: 'Spam message',
    isBot: true,
  });
  assert.equal(botPayload.get('botcheck'), '1'); // Bot submission: botcheck appended
});

test('parseWeb3FormsError - translates Web3Forms status codes and plan restrictions', () => {
  // HTTP 403 Forbidden
  const err403 = parseWeb3FormsError(403, null, false);
  assert.match(err403.message, /invalid or restricted/i);
  assert.equal(err403.isAttachmentPlanError, false);

  // HTTP 429 Rate Limit
  const err429 = parseWeb3FormsError(429, null, false);
  assert.match(err429.message, /too many/i);

  // Web3Forms Free plan attachment error response
  const proErrorResponse = {
    success: false,
    message: 'File attachments are available on Web3Forms Pro plan only. Please upgrade.',
  };
  const parsedAttachmentErr = parseWeb3FormsError(400, proErrorResponse, true);
  assert.equal(parsedAttachmentErr.isAttachmentPlanError, true);
  assert.match(parsedAttachmentErr.message, /Pro subscription to receive email attachments/i);

  // Normal error with attachment attached
  const otherErr = parseWeb3FormsError(500, { message: 'Internal Server Error' }, false);
  assert.equal(otherErr.isAttachmentPlanError, false);
  assert.match(otherErr.message, /Internal Server Error/i);
});
