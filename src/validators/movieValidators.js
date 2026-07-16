const Joi = require('joi');

const createMovieSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(1)
    .max(255)
    .required()
    .messages({
      'any.required': 'Movie title is required',
    }),
  description: Joi.string()
    .trim()
    .allow('', null),
  shortDescription: Joi.string()
    .trim()
    .max(500)
    .allow('', null),
  categoryId: Joi.number()
    .integer()
    .min(0)
    .allow(null),
  duration: Joi.number()
    .integer()
    .min(0)
    .allow(null),
  releaseYear: Joi.number()
    .integer()
    .min(1900)
    .max(2100)
    .allow(null),
  language: Joi.string()
    .trim()
    .max(50)
    .default('English'),
  quality: Joi.string()
    .trim()
    .max(20)
    .default('HD'),
  ageRating: Joi.string()
    .trim()
    .max(10)
    .allow('', null),
  director: Joi.string()
    .trim()
    .max(255)
    .allow('', null),
  castMembers: Joi.array()
    .items(Joi.string().trim())
    .allow(null),
  price: Joi.number()
    .precision(2)
    .min(0)
    .default(0),
  isFree: Joi.boolean()
    .default(false),
  isFeatured: Joi.boolean()
    .default(false),
  isSeries: Joi.boolean()
    .default(false),
  seriesId: Joi.number()
    .integer()
    .min(0)
    .allow(null),
  episodeNumber: Joi.number()
    .integer()
    .min(0)
    .allow(null),
  seasonNumber: Joi.number()
    .integer()
    .min(0)
    .allow(null),
  status: Joi.string()
    .valid('draft', 'published', 'hidden', 'archived', 'unavailable')
    .default('draft'),
});

const updateMovieSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(1)
    .max(255),
  description: Joi.string()
    .trim()
    .allow('', null),
  shortDescription: Joi.string()
    .trim()
    .max(500)
    .allow('', null),
  categoryId: Joi.number()
    .integer()
    .min(0)
    .allow(null),
  duration: Joi.number()
    .integer()
    .min(0)
    .allow(null),
  releaseYear: Joi.number()
    .integer()
    .min(1900)
    .max(2100)
    .allow(null),
  language: Joi.string()
    .trim()
    .max(50),
  quality: Joi.string()
    .trim()
    .max(20),
  ageRating: Joi.string()
    .trim()
    .max(10)
    .allow('', null),
  director: Joi.string()
    .trim()
    .max(255)
    .allow('', null),
  castMembers: Joi.array()
    .items(Joi.string().trim())
    .allow(null),
  price: Joi.number()
    .precision(2)
    .min(0),
  isFree: Joi.boolean(),
  isFeatured: Joi.boolean(),
  status: Joi.string()
    .valid('draft', 'published', 'hidden', 'archived', 'unavailable'),
  isSeries: Joi.boolean(),
  seriesId: Joi.number()
    .integer()
    .min(0)
    .allow(null),
  episodeNumber: Joi.number()
    .integer()
    .min(0)
    .allow(null),
  seasonNumber: Joi.number()
    .integer()
    .min(0)
    .allow(null),
});

const categorySchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'any.required': 'Category name is required',
    }),
  description: Joi.string()
    .trim()
    .allow('', null),
  parentId: Joi.number()
    .integer()
    .min(0)
    .allow(null),
  icon: Joi.string()
    .trim()
    .max(255)
    .allow('', null),
  displayOrder: Joi.number()
    .integer()
    .default(0),
  isVisible: Joi.boolean()
    .default(true),
  isSeries: Joi.boolean()
    .default(false),
});

const updateCategorySchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(100),
  description: Joi.string()
    .trim()
    .allow('', null),
  parentId: Joi.number()
    .integer()
    .min(0)
    .allow(null),
  icon: Joi.string()
    .trim()
    .max(255)
    .allow('', null),
  displayOrder: Joi.number()
    .integer(),
  isVisible: Joi.boolean(),
  isSeries: Joi.boolean(),
});

const searchSchema = Joi.object({
  q: Joi.string()
    .trim()
    .min(1)
    .max(200)
    .required()
    .messages({
      'any.required': 'Search query is required',
    }),
  category: Joi.string()
    .trim()
    .allow('', null),
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20),
  sort: Joi.string()
    .valid('relevance', 'newest', 'oldest', 'popular', 'price_asc', 'price_desc')
    .default('relevance'),
});

module.exports = {
  createMovieSchema,
  updateMovieSchema,
  categorySchema,
  updateCategorySchema,
  searchSchema,
};
