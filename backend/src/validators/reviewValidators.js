const Joi = require('joi');

const createReviewSchema = Joi.object({
  rating: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .required()
    .messages({
      'number.base': 'Rating must be a number',
      'number.integer': 'Rating must be an integer',
      'number.min': 'Rating must be at least 1',
      'number.max': 'Rating must not exceed 5',
      'any.required': 'Rating is required',
    }),
  comment: Joi.string()
    .trim()
    .max(2000)
    .allow('', null)
    .messages({
      'string.max': 'Comment must not exceed 2000 characters',
    }),
}).options({ abortEarly: false, stripUnknown: true });

const updateReviewSchema = Joi.object({
  rating: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .messages({
      'number.base': 'Rating must be a number',
      'number.integer': 'Rating must be an integer',
      'number.min': 'Rating must be at least 1',
      'number.max': 'Rating must not exceed 5',
    }),
  comment: Joi.string()
    .trim()
    .max(2000)
    .allow('', null)
    .messages({
      'string.max': 'Comment must not exceed 2000 characters',
    }),
}).min(1).options({ abortEarly: false, stripUnknown: true });

module.exports = {
  createReviewSchema,
  updateReviewSchema,
};
