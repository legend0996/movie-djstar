const Joi = require('joi');

const kenyanPhonePattern = /^(?:\+254|0|254)[17]\d{8}$/;

const initiatePurchaseSchema = Joi.object({
  movieId: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({
      'number.base': 'Movie ID must be a number',
      'number.integer': 'Movie ID must be an integer',
      'number.min': 'Movie ID must be a positive number',
      'any.required': 'Movie ID is required',
    }),
  phoneNumber: Joi.string()
    .pattern(kenyanPhonePattern)
    .required()
    .messages({
      'string.pattern.base': 'Please provide a valid Safaricom phone number (e.g. +2547XXXXXXXX)',
      'any.required': 'Phone number is required',
    }),
}).options({ abortEarly: false, stripUnknown: true });

const queryPaymentStatusSchema = Joi.object({
  checkoutRequestId: Joi.string()
    .required()
    .messages({
      'any.required': 'Checkout request ID is required',
    }),
}).options({ abortEarly: false, stripUnknown: true });

const purchaseHistorySchema = Joi.object({
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

module.exports = {
  initiatePurchaseSchema,
  queryPaymentStatusSchema,
  purchaseHistorySchema,
};
