const Joi = require('joi');

const supportTicketSchema = Joi.object({
  subject: Joi.string()
    .trim()
    .min(5)
    .max(255)
    .required()
    .messages({
      'string.min': 'Subject must be at least 5 characters',
      'string.max': 'Subject must not exceed 255 characters',
      'any.required': 'Subject is required',
    }),
  message: Joi.string()
    .trim()
    .min(10)
    .max(5000)
    .required()
    .messages({
      'string.min': 'Message must be at least 10 characters',
      'string.max': 'Message must not exceed 5000 characters',
      'any.required': 'Message is required',
    }),
  priority: Joi.string()
    .valid('low', 'medium', 'high', 'urgent')
    .default('medium')
    .messages({
      'any.only': 'Priority must be one of: low, medium, high, urgent',
    }),
}).options({ abortEarly: false, stripUnknown: true });

const supportReplySchema = Joi.object({
  message: Joi.string()
    .trim()
    .min(1)
    .max(5000)
    .required()
    .messages({
      'string.min': 'Message is required',
      'string.max': 'Message must not exceed 5000 characters',
      'any.required': 'Message is required',
    }),
}).options({ abortEarly: false, stripUnknown: true });

const updateTicketStatusSchema = Joi.object({
  status: Joi.string()
    .valid('open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed')
    .required()
    .messages({
      'any.only': 'Status must be one of: open, in_progress, waiting_on_customer, resolved, closed',
      'any.required': 'Status is required',
    }),
}).options({ abortEarly: false, stripUnknown: true });

module.exports = {
  supportTicketSchema,
  supportReplySchema,
  updateTicketStatusSchema,
};
