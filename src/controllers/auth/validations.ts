import Joi from "joi";

export const signupSchema = Joi.object({
  name: Joi.string().required().messages({
    "any.required": "Name is required",
  }),
  phoneNumber: Joi.string()
    .pattern(/^\+91[6-9]\d{9}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid phone number",
      "string.empty": "Phone number is required",
      "any.required": "Phone number is required",
    }),
  age: Joi.number().optional(),
  email: Joi.string().email().optional(),
  gender: Joi.string().optional(),
  occupation: Joi.string().optional(),
});

export const signinSchema = Joi.object({
  phoneNumber: Joi.string()
    .pattern(/^\+91[6-9]\d{9}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid phone number",
      "string.empty": "Phone number is required",
      "any.required": "Phone number is required",
    }),
  code: Joi.string()
    .pattern(/^[0-9]+$/)
    .optional()
    .min(6)
    .message("Invalid code")
    .max(6)
    .message("Invalid code"),
  isTest: Joi.boolean().optional(),
  expiresIn: Joi.string().optional(),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    "any.required": "Refresh token is required",
  }),
});

export const logoutSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    "any.required": "Refresh token is required",
  }),
});
