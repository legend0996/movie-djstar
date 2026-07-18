const Joi = require('joi');

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,128}$/;
const kenyanPhonePattern = /^(?:\+254|0|254)[17]\d{8}$/;
const jwtPattern = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;

const registerSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.alphanum': 'Username must contain only letters and numbers',
      'string.min': 'Username must be at least 3 characters',
      'string.max': 'Username must not exceed 30 characters',
      'any.required': 'Username is required',
    }),
  email: Joi.string()
    .email()
    .max(255)
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.max': 'Email must not exceed 255 characters',
      'any.required': 'Email is required',
    }),
  phone: Joi.string()
    .pattern(kenyanPhonePattern)
    .allow('', null)
    .messages({
      'string.pattern.base': 'Please provide a valid Kenyan phone number (e.g. +2547XXXXXXXX)',
    }),
  password: Joi.string()
    .pattern(passwordPattern)
    .required()
    .messages({
      'string.pattern.base': 'Password must be at least 8 characters with one uppercase, one lowercase, one number, and one special character',
      'any.required': 'Password is required',
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Please confirm your password',
    }),
  firstName: Joi.string()
    .trim()
    .max(100)
    .allow('', null)
    .messages({
      'string.max': 'First name must not exceed 100 characters',
    }),
  lastName: Joi.string()
    .trim()
    .max(100)
    .allow('', null)
    .messages({
      'string.max': 'Last name must not exceed 100 characters',
    }),
}).options({ abortEarly: false, stripUnknown: true });

const loginStep1Schema = Joi.object({
  username: Joi.string()
    .required()
    .messages({
      'any.required': 'Username is required',
    }),
}).options({ abortEarly: false, stripUnknown: true });

const loginStep2Schema = Joi.object({
  username: Joi.string()
    .required()
    .messages({
      'any.required': 'Username is required',
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required',
    }),
}).options({ abortEarly: false, stripUnknown: true });

const emailVerificationSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
  code: Joi.string()
    .length(6)
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      'string.length': 'Verification code must be exactly 6 digits',
      'string.pattern.base': 'Verification code must contain only digits',
      'any.required': 'Verification code is required',
    }),
}).options({ abortEarly: false, stripUnknown: true });

const resendVerificationSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
}).options({ abortEarly: false, stripUnknown: true });

const forgotPasswordSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
}).options({ abortEarly: false, stripUnknown: true });

const resetPasswordSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
  code: Joi.string()
    .length(6)
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      'string.length': 'Verification code must be exactly 6 digits',
      'string.pattern.base': 'Verification code must contain only digits',
      'any.required': 'Verification code is required',
    }),
  password: Joi.string()
    .pattern(passwordPattern)
    .required()
    .messages({
      'string.pattern.base': 'Password must be at least 8 characters with one uppercase, one lowercase, one number, and one special character',
      'any.required': 'Password is required',
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Please confirm your password',
    }),
}).options({ abortEarly: false, stripUnknown: true });

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required',
    }),
  newPassword: Joi.string()
    .pattern(passwordPattern)
    .required()
    .messages({
      'string.pattern.base': 'Password must be at least 8 characters with one uppercase, one lowercase, one number, and one special character',
      'any.required': 'New password is required',
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Please confirm your new password',
    }),
}).options({ abortEarly: false, stripUnknown: true });

const updateProfileSchema = Joi.object({
  firstName: Joi.string()
    .trim()
    .max(100)
    .allow('', null)
    .messages({
      'string.max': 'First name must not exceed 100 characters',
    }),
  lastName: Joi.string()
    .trim()
    .max(100)
    .allow('', null)
    .messages({
      'string.max': 'Last name must not exceed 100 characters',
    }),
  phone: Joi.string()
    .pattern(kenyanPhonePattern)
    .allow('', null)
    .messages({
      'string.pattern.base': 'Please provide a valid Kenyan phone number (e.g. +2547XXXXXXXX)',
    }),
  avatarUrl: Joi.string()
    .uri()
    .allow('', null)
    .messages({
      'string.uri': 'Please provide a valid URL for the avatar',
    }),
}).options({ abortEarly: false, stripUnknown: true });

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string()
    .pattern(jwtPattern)
    .required()
    .messages({
      'string.pattern.base': 'Invalid refresh token format',
      'any.required': 'Refresh token is required',
    }),
}).options({ abortEarly: false, stripUnknown: true });

module.exports = {
  registerSchema,
  loginStep1Schema,
  loginStep2Schema,
  emailVerificationSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
  refreshTokenSchema,
};
