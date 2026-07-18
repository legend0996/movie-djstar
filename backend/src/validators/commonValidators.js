const Joi = require('joi');

const idParamSchema = Joi.object({
  id: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.base': 'ID must be a number',
      'number.integer': 'ID must be an integer',
      'number.min': 'ID must be a positive integer',
      'any.required': 'ID is required',
    }),
}).options({ abortEarly: false, stripUnknown: true });

const slugParamSchema = Joi.object({
  slug: Joi.string()
    .required()
    .messages({
      'any.required': 'Slug is required',
    }),
}).options({ abortEarly: false, stripUnknown: true });

const paginationQuerySchema = Joi.object({
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
  idParamSchema,
  slugParamSchema,
  paginationQuerySchema,
};
