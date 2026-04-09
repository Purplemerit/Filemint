/**
 * Validation Schemas and Utilities
 * Schema-based validation for API requests
 */

import { VALIDATION_RULES, ERROR_MESSAGES } from '../config/constants';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface ValidationSchema {
  [key: string]: ValidationRule | ValidationRule[];
}

interface ValidationRule {
  type: 'string' | 'email' | 'password' | 'otp' | 'boolean' | 'number' | 'date';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  message?: string;
}

class Validator {
  private emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  private passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

  validate(data: Record<string, any>, schema: ValidationSchema): ValidationResult {
    const errors: Record<string, string> = {};

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      const ruleArray = Array.isArray(rules) ? rules : [rules];

      for (const rule of ruleArray) {
        const error = this.validateField(field, value, rule);
        if (error) {
          errors[field] = error;
          break; // Stop on first error for this field
        }
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  private validateField(fieldName: string, value: any, rule: ValidationRule): string | null {
    // Check required
    if (rule.required && (value === undefined || value === null || value === '')) {
      return rule.message || `${fieldName} is required`;
    }

    // If not required and empty, skip further validation
    if (!rule.required && (value === undefined || value === null || value === '')) {
      return null;
    }

    // Type-specific validation
    switch (rule.type) {
      case 'string':
        if (typeof value !== 'string') {
          return rule.message || `${fieldName} must be a string`;
        }
        if (rule.minLength && value.length < rule.minLength) {
          return rule.message || `${fieldName} must be at least ${rule.minLength} characters`;
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          return rule.message || `${fieldName} must not exceed ${rule.maxLength} characters`;
        }
        if (rule.pattern && !rule.pattern.test(value)) {
          return rule.message || `${fieldName} format is invalid`;
        }
        break;

      case 'email':
        if (!this.emailRegex.test(value)) {
          return rule.message || ERROR_MESSAGES.VALIDATION_INVALID_EMAIL;
        }
        if (value.length > VALIDATION_RULES.EMAIL_MAX_LENGTH) {
          return rule.message || `Email must not exceed ${VALIDATION_RULES.EMAIL_MAX_LENGTH} characters`;
        }
        break;

      case 'password':
        if (typeof value !== 'string') {
          return rule.message || `${fieldName} must be a string`;
        }
        if (value.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
          return rule.message || `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters`;
        }
        if (VALIDATION_RULES.PASSWORD_REQUIRE_UPPERCASE && !/[A-Z]/.test(value)) {
          return rule.message || 'Password must contain at least one uppercase letter';
        }
        if (VALIDATION_RULES.PASSWORD_REQUIRE_NUMBERS && !/\d/.test(value)) {
          return rule.message || 'Password must contain at least one number';
        }
        if (VALIDATION_RULES.PASSWORD_REQUIRE_SPECIAL && !/[@$!%*?&]/.test(value)) {
          return rule.message || 'Password must contain at least one special character (@$!%*?&)';
        }
        break;

      case 'otp':
        if (typeof value !== 'string') {
          return rule.message || `${fieldName} must be a string`;
        }
        if (!/^\d{6}$/.test(value)) {
          return rule.message || `${fieldName} must be a 6-digit code`;
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          return rule.message || `${fieldName} must be a boolean`;
        }
        break;

      case 'number':
        if (typeof value !== 'number') {
          return rule.message || `${fieldName} must be a number`;
        }
        break;

      case 'date':
        if (!(value instanceof Date) && typeof value !== 'string') {
          return rule.message || `${fieldName} must be a valid date`;
        }
        break;
    }

    return null;
  }
}

// Validation schemas for different endpoints
export const ValidationSchemas = {
  signup: {
    firstName: { type: 'string' as const, required: true, minLength: 2, maxLength: 50 },
    lastName: { type: 'string' as const, required: true, minLength: 2, maxLength: 50 },
    email: { type: 'email' as const, required: true },
    password: { type: 'password' as const, required: true },
    termsAccepted: { type: 'boolean' as const, required: true },
  },

  login: {
    email: { type: 'email' as const, required: true },
    password: { type: 'password' as const, required: true },
  },

  verifyEmail: {
    email: { type: 'email' as const, required: true },
    otp: { type: 'otp' as const, required: true },
  },

  sendVerification: {
    email: { type: 'email' as const, required: true },
  },

  setPassword: {
    password: { type: 'password' as const, required: true },
    confirmPassword: { type: 'password' as const, required: true },
  },
};

export const validator = new Validator();
