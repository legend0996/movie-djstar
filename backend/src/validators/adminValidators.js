const Joi = require('joi');

const updateUserStatusSchema = Joi.object({
  status: Joi.string()
    .valid('active', 'unverified', 'suspended', 'disabled')
    .required()
    .messages({
      'any.only': 'Status must be one of: active, unverified, suspended, disabled',
      'any.required': 'Status is required',
    }),
}).options({ abortEarly: false, stripUnknown: true });

const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be 1 or greater',
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must not exceed 100',
    }),
}).options({ abortEarly: false, stripUnknown: true });

const dateRangeSchema = Joi.object({
  startDate: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': 'Start date must be a valid ISO date',
    }),
  endDate: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': 'End date must be a valid ISO date',
    }),
}).options({ abortEarly: false, stripUnknown: true });

const auditLogQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be 1 or greater',
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must not exceed 100',
    }),
  action: Joi.string()
    .trim()
    .optional()
    .messages({
      'string.base': 'Action must be a string',
    }),
  userId: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.base': 'User ID must be a number',
      'number.integer': 'User ID must be an integer',
    }),
  entityType: Joi.string()
    .trim()
    .optional()
    .messages({
      'string.base': 'Entity type must be a string',
    }),
  startDate: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': 'Start date must be a valid ISO date',
    }),
  endDate: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': 'End date must be a valid ISO date',
    }),
}).options({ abortEarly: false, stripUnknown: true });

const adminTicketQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be 1 or greater',
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must not exceed 100',
    }),
  status: Joi.string()
    .valid('open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed')
    .optional()
    .messages({
      'any.only': 'Status must be one of: open, in_progress, waiting_on_customer, resolved, closed',
    }),
  priority: Joi.string()
    .valid('low', 'medium', 'high', 'urgent')
    .optional()
    .messages({
      'any.only': 'Priority must be one of: low, medium, high, urgent',
    }),
}).options({ abortEarly: false, stripUnknown: true });

const updateUserSchema = Joi.object({
  firstName: Joi.string().trim().max(100).optional().messages({
    'string.max': 'First name must not exceed 100 characters',
  }),
  lastName: Joi.string().trim().max(100).optional().messages({
    'string.max': 'Last name must not exceed 100 characters',
  }),
  phone: Joi.string().trim().optional(),
  avatarUrl: Joi.string().uri().max(500).optional().allow('', null).messages({
    'string.uri': 'Avatar URL must be a valid URL',
    'string.max': 'Avatar URL must not exceed 500 characters',
  }),
  email: Joi.string().email().optional().messages({
    'string.email': 'Email must be a valid email address',
  }),
  status: Joi.string()
    .valid('active', 'unverified', 'suspended', 'disabled')
    .optional()
    .messages({
      'any.only': 'Status must be one of: active, unverified, suspended, disabled',
    }),
}).min(1).options({ abortEarly: false, stripUnknown: true });

module.exports = {
  updateUserStatusSchema,
  updateUserSchema,
  paginationSchema,
  dateRangeSchema,
  auditLogQuerySchema,
  adminTicketQuerySchema,
};
