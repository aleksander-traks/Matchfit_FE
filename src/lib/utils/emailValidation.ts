export function isValidEmail(email: string): boolean {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
}

export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export interface EmailValidationResult {
  valid: boolean;
  error?: string;
}

export function validateEmailFormat(email: string): EmailValidationResult {
  if (!email || email.trim().length === 0) {
    return {
      valid: false,
      error: 'Email address is required',
    };
  }

  const normalized = normalizeEmail(email);

  if (normalized.length < 5) {
    return {
      valid: false,
      error: 'Email address is too short',
    };
  }

  if (!isValidEmail(normalized)) {
    return {
      valid: false,
      error: 'Please enter a valid email address',
    };
  }

  if (normalized.length > 254) {
    return {
      valid: false,
      error: 'Email address is too long',
    };
  }

  return {
    valid: true,
  };
}
