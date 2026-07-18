const Joi = require('joi');

const createMovieSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.min': 'Movie title is required',
      'string.max': 'Movie title must not exceed 255 characters',
      'any.required': 'Movie title is required',
    }),
  description: Joi.string()
    .trim()
    .allow('', null),
  shortDescription: Joi.string()
    .trim()
    .max(500)
    .allow('', null)
    .messages({
      'string.max': 'Short description must not exceed 500 characters',
    }),
  categoryId: Joi.number()
    .integer()
    .min(0)
    .allow(null)
    .messages({
      'number.base': 'Category ID must be a number',
      'number.integer': 'Category ID must be an integer',
    }),
  duration: Joi.number()
    .integer()
    .min(0)
    .allow(null)
    .messages({
      'number.base': 'Duration must be a number',
      'number.integer': 'Duration must be an integer',
      'number.min': 'Duration must be a positive number',
    }),
  releaseYear: Joi.number()
    .integer()
    .min(1900)
    .max(2100)
    .allow(null)
    .messages({
      'number.base': 'Release year must be a number',
      'number.integer': 'Release year must be an integer',
      'number.min': 'Release year must be 1900 or later',
      'number.max': 'Release year must be 2100 or earlier',
    }),
  language: Joi.string()
    .trim()
    .max(50)
    .default('English')
    .messages({
      'string.max': 'Language must not exceed 50 characters',
    }),
  quality: Joi.string()
    .trim()
    .max(20)
    .default('HD')
    .messages({
      'string.max': 'Quality must not exceed 20 characters',
    }),
  ageRating: Joi.string()
    .trim()
    .max(10)
    .allow('', null)
    .messages({
      'string.max': 'Age rating must not exceed 10 characters',
    }),
  director: Joi.string()
    .trim()
    .max(255)
    .allow('', null)
    .messages({
      'string.max': 'Director name must not exceed 255 characters',
    }),
  castMembers: Joi.array()
    .items(Joi.string().trim())
    .allow(null)
    .messages({
      'array.base': 'Cast members must be an array',
    }),
  price: Joi.number()
    .precision(2)
    .min(0)
    .default(0)
    .messages({
      'number.base': 'Price must be a number',
      'number.min': 'Price must be 0 or greater',
    }),
  isFree: Joi.boolean()
    .default(false)
    .messages({
      'boolean.base': 'isFree must be a boolean',
    }),
  isFeatured: Joi.boolean()
    .default(false)
    .messages({
      'boolean.base': 'isFeatured must be a boolean',
    }),
  isSeries: Joi.boolean()
    .default(false)
    .messages({
      'boolean.base': 'isSeries must be a boolean',
    }),
  seriesId: Joi.number()
    .integer()
    .min(0)
    .allow(null)
    .messages({
      'number.base': 'Series ID must be a number',
      'number.integer': 'Series ID must be an integer',
    }),
  episodeNumber: Joi.number()
    .integer()
    .min(0)
    .allow(null)
    .messages({
      'number.base': 'Episode number must be a number',
      'number.integer': 'Episode number must be an integer',
      'number.min': 'Episode number must be 0 or greater',
    }),
  seasonNumber: Joi.number()
    .integer()
    .min(0)
    .allow(null)
    .messages({
      'number.base': 'Season number must be a number',
      'number.integer': 'Season number must be an integer',
      'number.min': 'Season number must be 0 or greater',
    }),
  status: Joi.string()
    .valid('draft', 'published', 'hidden', 'archived', 'unavailable')
    .default('draft')
    .messages({
      'any.only': 'Status must be one of: draft, published, hidden, archived, unavailable',
    }),
}).options({ abortEarly: false, stripUnknown: true });

const updateMovieSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(1)
    .max(255)
    .messages({
      'string.min': 'Movie title is required',
      'string.max': 'Movie title must not exceed 255 characters',
    }),
  description: Joi.string()
    .trim()
    .allow('', null),
  shortDescription: Joi.string()
    .trim()
    .max(500)
    .allow('', null)
    .messages({
      'string.max': 'Short description must not exceed 500 characters',
    }),
  categoryId: Joi.number()
    .integer()
    .min(0)
    .allow(null)
    .messages({
      'number.base': 'Category ID must be a number',
      'number.integer': 'Category ID must be an integer',
    }),
  duration: Joi.number()
    .integer()
    .min(0)
    .allow(null)
    .messages({
      'number.base': 'Duration must be a number',
      'number.integer': 'Duration must be an integer',
      'number.min': 'Duration must be a positive number',
    }),
  releaseYear: Joi.number()
    .integer()
    .min(1900)
    .max(2100)
    .allow(null)
    .messages({
      'number.base': 'Release year must be a number',
      'number.integer': 'Release year must be an integer',
      'number.min': 'Release year must be 1900 or later',
      'number.max': 'Release year must be 2100 or earlier',
    }),
  language: Joi.string()
    .trim()
    .max(50)
    .messages({
      'string.max': 'Language must not exceed 50 characters',
    }),
  quality: Joi.string()
    .trim()
    .max(20)
    .messages({
      'string.max': 'Quality must not exceed 20 characters',
    }),
  ageRating: Joi.string()
    .trim()
    .max(10)
    .allow('', null)
    .messages({
      'string.max': 'Age rating must not exceed 10 characters',
    }),
  director: Joi.string()
    .trim()
    .max(255)
    .allow('', null)
    .messages({
      'string.max': 'Director name must not exceed 255 characters',
    }),
  castMembers: Joi.array()
    .items(Joi.string().trim())
    .allow(null)
    .messages({
      'array.base': 'Cast members must be an array',
    }),
  price: Joi.number()
    .precision(2)
    .min(0)
    .messages({
      'number.base': 'Price must be a number',
      'number.min': 'Price must be 0 or greater',
    }),
  isFree: Joi.boolean()
    .messages({
      'boolean.base': 'isFree must be a boolean',
    }),
  isFeatured: Joi.boolean()
    .messages({
      'boolean.base': 'isFeatured must be a boolean',
    }),
  isSeries: Joi.boolean()
    .messages({
      'boolean.base': 'isSeries must be a boolean',
    }),
  seriesId: Joi.number()
    .integer()
    .min(0)
    .allow(null)
    .messages({
      'number.base': 'Series ID must be a number',
      'number.integer': 'Series ID must be an integer',
    }),
  episodeNumber: Joi.number()
    .integer()
    .min(0)
    .allow(null)
    .messages({
      'number.base': 'Episode number must be a number',
      'number.integer': 'Episode number must be an integer',
      'number.min': 'Episode number must be 0 or greater',
    }),
  seasonNumber: Joi.number()
    .integer()
    .min(0)
    .allow(null)
    .messages({
      'number.base': 'Season number must be a number',
      'number.integer': 'Season number must be an integer',
      'number.min': 'Season number must be 0 or greater',
    }),
  status: Joi.string()
    .valid('draft', 'published', 'hidden', 'archived', 'unavailable')
    .messages({
      'any.only': 'Status must be one of: draft, published, hidden, archived, unavailable',
    }),
}).options({ abortEarly: false, stripUnknown: true });

const categorySchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'Category name is required',
      'string.max': 'Category name must not exceed 100 characters',
      'any.required': 'Category name is required',
    }),
  description: Joi.string()
    .trim()
    .allow('', null),
  parentId: Joi.number()
    .integer()
    .min(0)
    .allow(null)
    .messages({
      'number.base': 'Parent ID must be a number',
      'number.integer': 'Parent ID must be an integer',
    }),
  icon: Joi.string()
    .trim()
    .max(255)
    .allow('', null)
    .messages({
      'string.max': 'Icon must not exceed 255 characters',
    }),
  displayOrder: Joi.number()
    .integer()
    .default(0)
    .messages({
      'number.base': 'Display order must be a number',
      'number.integer': 'Display order must be an integer',
    }),
  isVisible: Joi.boolean()
    .default(true)
    .messages({
      'boolean.base': 'isVisible must be a boolean',
    }),
  isSeries: Joi.boolean()
    .default(false)
    .messages({
      'boolean.base': 'isSeries must be a boolean',
    }),
}).options({ abortEarly: false, stripUnknown: true });

const updateCategorySchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .messages({
      'string.min': 'Category name is required',
      'string.max': 'Category name must not exceed 100 characters',
    }),
  description: Joi.string()
    .trim()
    .allow('', null),
  parentId: Joi.number()
    .integer()
    .min(0)
    .allow(null)
    .messages({
      'number.base': 'Parent ID must be a number',
      'number.integer': 'Parent ID must be an integer',
    }),
  icon: Joi.string()
    .trim()
    .max(255)
    .allow('', null)
    .messages({
      'string.max': 'Icon must not exceed 255 characters',
    }),
  displayOrder: Joi.number()
    .integer()
    .messages({
      'number.base': 'Display order must be a number',
      'number.integer': 'Display order must be an integer',
    }),
  isVisible: Joi.boolean()
    .messages({
      'boolean.base': 'isVisible must be a boolean',
    }),
  isSeries: Joi.boolean()
    .messages({
      'boolean.base': 'isSeries must be a boolean',
    }),
}).options({ abortEarly: false, stripUnknown: true });

const searchSchema = Joi.object({
  q: Joi.string()
    .trim()
    .min(1)
    .max(200)
    .required()
    .messages({
      'string.min': 'Search query is required',
      'string.max': 'Search query must not exceed 200 characters',
      'any.required': 'Search query is required',
    }),
  category: Joi.string()
    .trim()
    .allow('', null),
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
  sort: Joi.string()
    .valid('relevance', 'newest', 'oldest', 'popular', 'price_asc', 'price_desc')
    .default('relevance')
    .messages({
      'any.only': 'Sort must be one of: relevance, newest, oldest, popular, price_asc, price_desc',
    }),
}).options({ abortEarly: false, stripUnknown: true });

module.exports = {
  createMovieSchema,
  updateMovieSchema,
  categorySchema,
  updateCategorySchema,
  searchSchema,
};
