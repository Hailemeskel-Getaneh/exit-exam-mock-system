/**
 * Security Utilities
 * Provides password hashing, validation, and input sanitization functions
 */

// Simple password hashing using Web Crypto API (no external dependencies)
// This is a basic implementation for demo purposes
// For production, use a proper library like bcryptjs on the backend

const HASH_ALGORITHM = 'SHA-256';

/**
 * Hash a password using SHA-256 + salt
 * Note: For production, use bcryptjs or similar on backend
 */
export const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest(HASH_ALGORITHM, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Validate password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!password) {
    errors.push('Password is required');
  } else {
    if (password.length < 8) {
      errors.push('Must be at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Must contain at least one lowercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Must contain at least one number');
    }
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Validate username
 * Requirements:
 * - 3-20 characters
 * - Alphanumeric and underscores only
 * - No leading/trailing spaces
 */
export const validateUsername = (username: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!username) {
    errors.push('Username is required');
  } else {
    const trimmed = username.trim();
    if (trimmed.length < 3) {
      errors.push('Username must be at least 3 characters');
    }
    if (trimmed.length > 20) {
      errors.push('Username must not exceed 20 characters');
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(trimmed)) {
      errors.push('Username can only contain letters, numbers, underscores, dots, and hyphens');
    }
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Sanitize text input to prevent XSS attacks
 */
export const sanitizeInput = (input: string, maxLength: number = 5000): string => {
  if (!input) return '';
  
  return input
    .trim()
    .substring(0, maxLength)
    .replace(/[<>]/g, '') // Remove angle brackets (HTML tags)
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
};

/**
 * Sanitize email
 */
export const sanitizeEmail = (email: string): string => {
  return sanitizeInput(email, 254).toLowerCase();
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Generate a secure random password
 */
export const generateSecurePassword = (): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  
  const all = uppercase + lowercase + numbers + symbols;
  let password = '';
  
  // Ensure at least one of each required character type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  for (let i = password.length; i < 12; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }
  
  // Shuffle
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * Rate limiting helper - track login attempts
 */
const loginAttempts = new Map<string, { count: number; timestamp: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export const checkLoginAttempts = (identifier: string): { allowed: boolean; message?: string } => {
  const now = Date.now();
  const attempt = loginAttempts.get(identifier);

  if (!attempt) {
    return { allowed: true };
  }

  if (now - attempt.timestamp > LOCKOUT_DURATION_MS) {
    loginAttempts.delete(identifier);
    return { allowed: true };
  }

  if (attempt.count >= MAX_ATTEMPTS) {
    const remainingMinutes = Math.ceil((LOCKOUT_DURATION_MS - (now - attempt.timestamp)) / 60000);
    return {
      allowed: false,
      message: `Too many login attempts. Try again in ${remainingMinutes} minutes.`
    };
  }

  return { allowed: true };
};

export const recordLoginAttempt = (identifier: string, success: boolean): void => {
  if (success) {
    loginAttempts.delete(identifier);
    return;
  }

  const now = Date.now();
  const attempt = loginAttempts.get(identifier);

  if (!attempt || now - attempt.timestamp > LOCKOUT_DURATION_MS) {
    loginAttempts.set(identifier, { count: 1, timestamp: now });
  } else {
    attempt.count++;
    attempt.timestamp = now;
  }
};

/**
 * Session timeout helper
 */
const sessionTimeouts = new Map<string, number>();
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export const createSession = (sessionId: string): void => {
  sessionTimeouts.set(sessionId, Date.now());
};

export const isSessionValid = (sessionId: string): boolean => {
  const timestamp = sessionTimeouts.get(sessionId);
  if (!timestamp) return false;
  
  const isValid = Date.now() - timestamp < SESSION_TIMEOUT_MS;
  if (!isValid) {
    sessionTimeouts.delete(sessionId);
  }
  return isValid;
};

export const extendSession = (sessionId: string): void => {
  if (sessionTimeouts.has(sessionId)) {
    sessionTimeouts.set(sessionId, Date.now());
  }
};

export const destroySession = (sessionId: string): void => {
  sessionTimeouts.delete(sessionId);
};

/**
 * CSV/JSON input validation for exam imports
 */
export const validateExamImportRow = (row: any, rowNumber: number): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!row.text || typeof row.text !== 'string') {
    errors.push(`Row ${rowNumber}: Question text is required`);
  } else if (row.text.length > 2000) {
    errors.push(`Row ${rowNumber}: Question text exceeds 2000 characters`);
  }

  const requiredOptions = ['option_a', 'option_b', 'option_c', 'option_d'];
  for (const opt of requiredOptions) {
    if (!row[opt] || typeof row[opt] !== 'string') {
      errors.push(`Row ${rowNumber}: ${opt} is required`);
    } else if (row[opt].length > 500) {
      errors.push(`Row ${rowNumber}: ${opt} exceeds 500 characters`);
    }
  }

  if (!row.correct_answer || !['a', 'b', 'c', 'd'].includes(String(row.correct_answer).toLowerCase())) {
    errors.push(`Row ${rowNumber}: correct_answer must be 'a', 'b', 'c', or 'd'`);
  }

  if (row.points !== undefined) {
    const points = parseFloat(row.points);
    if (isNaN(points) || points <= 0 || points > 100) {
      errors.push(`Row ${rowNumber}: points must be a number between 0 and 100`);
    }
  }

  return { valid: errors.length === 0, errors };
};
