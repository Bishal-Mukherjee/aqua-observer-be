import { rateLimit } from "express-rate-limit";

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 150,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (req, res) => {
    return res.status(429).json({
      message: "Too many requests, please try again later.",
    });
  },
});
