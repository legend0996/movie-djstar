const Joi = require('joi');

const initiatePurchaseSchema = Joi.object({
  movieId: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({
      'any.required': 'Movie ID is required',
    }),
  phoneNumber: Joi.string()
    .pattern(/^(?:\+254|0|254)[17]\d{8}$/)
    .required()
    .messages({
      'string.pattern.base': 'Please provide a valid Safaricom phone number',
      'any.required': 'Phone number is required',
    }),
});

const supportTicketSchema = Joi.object({
  subject: Joi.string()
    .trim()
    .min(5)
    .max(255)
    .required()
    .messages({
      'string.min': 'Subject must be at least 5 characters',
      'any.required': 'Subject is required',
    }),
  message: Joi.string()
    .trim()
    .min(10)
    .max(5000)
    .required()
    .messages({
      'string.min': 'Message must be at least 10 characters',
      'any.required': 'Message is required',
    }),
  priority: Joi.string()
    .valid('low', 'medium', 'high', 'urgent')
    .default('medium'),
});

const supportReplySchema = Joi.object({
  message: Joi.string()
    .trim()
    .min(1)
    .max(5000)
    .required()
    .messages({
      'any.required': 'Message is required',
    }),
});

const updateTicketStatusSchema = Joi.object({
  status: Joi.string()
    .valid('open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed')
    .required()
    .messages({
      'any.required': 'Status is required',
    }),
});

module.exports = {
  initiatePurchaseSchema,
  supportTicketSchema,
  supportReplySchema,
  updateTicketStatusSchema,
};
