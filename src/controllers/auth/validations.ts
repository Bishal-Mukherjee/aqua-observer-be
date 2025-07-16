import Joi from "joi";

export const signupSchema = Joi.object({
  name: Joi.string().required().messages({
    "any.required": "Name is required",
  }),
  phoneNumber: Joi.string().required().messages({
    "any.required": "Phone number is required",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});

export const signinSchema = Joi.object({
  phoneNumber: Joi.string().required().messages({
    "any.required": "Phone number is required",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
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

export const forgotPasswordSchema = Joi.object({
  phoneNumber: Joi.string().required().messages({
    "any.required": "Phone number is required",
  }),
});

export const validateOtpSchema = Joi.object({
  id: Joi.string().required().messages({
    "any.required": "ID is required",
  }),
  code: Joi.string()
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      "any.required": "Code is required",
    })
    .min(6)
    .message("Invalid code")
    .max(6)
    .message("Invalid code"),
});

export const resetPasswordSchema = Joi.object({
  phoneNumber: Joi.string().required().messages({
    "any.required": "Phone number is required",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});
