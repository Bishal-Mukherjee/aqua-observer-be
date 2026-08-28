import Joi from "joi";

export const postPublicSightingSchema = Joi.object({
  observedAt: Joi.date().iso().required().messages({
    "date.base": "ObservedAt must be a valid date",
    "any.required": "ObservedAt is a required field",
  }),
  species: Joi.array()
    .items(Joi.object().unknown(true))
    .min(1)
    .required()
    .messages({
      "array.base": "Species must be an array",
      "array.min": "Species must contain at least 1 record",
      "any.required": "Species is a required field",
    }),
  waterBodyCondition: Joi.string().required().messages({
    "string.base": "Water body condition must be a string",
    "any.required": "Water body condition is a required field",
  }),
  weatherCondition: Joi.string().required().messages({
    "string.base": "Weather condition must be a string",
    "any.required": "Weather condition is a required field",
  }),
  hasWindyOrStormyWeather: Joi.string().required().messages({
    "string.base": "hasWindyOrStormyWeather must be a string",
    "any.required": "hasWindyOrStormyWeather is a required field",
  }),
  channelType: Joi.string().required().messages({
    "string.base": "Water body channel type must be a string",
    "any.required": "Water body channel type is a required field",
  }),
  waterBody: Joi.string().required().messages({
    "string.base": "Water body must be a string",
    "any.required": "Water body is a required field",
  }),
  threats: Joi.array().items(Joi.string()).required().messages({
    "array.base": "Threats must be an array",
    "any.required": "Threats is a required field",
  }),
  district: Joi.string().required().messages({
    "string.base": "District must be a string",
    "any.required": "District is a required field",
  }),
  block: Joi.string().required().messages({
    "string.base": "Block must be a string",
    "any.required": "Block is a required field",
  }),
  villageOrGhat: Joi.string().required().messages({
    "string.base": "Village or ghat must be a string",
    "any.required": "Village or ghat is a required field",
  }),
  landmark: Joi.string().allow(null, "").optional(),
  fishingGears: Joi.array().items(Joi.string().allow(null, "")).optional(),
  images: Joi.array().items(Joi.string().allow(null, "")).optional(),
  notes: Joi.string().allow(null, "").optional(),
});
