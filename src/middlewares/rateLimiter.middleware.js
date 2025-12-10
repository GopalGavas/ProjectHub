import { Ratelimit } from "@upstash/ratelimit";
import redis from "../db/redis.js";

export const globalLimiter = (req, res, next) => {
  const ip = req.ip || "unknown";

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "10 m"),
  });

  limiter.limit(ip).then((result) => {
    if (!result.success) {
      return res.status(429).json({
        success: false,
        message: "Too many requests, slow down.",
      });
    }

    next();
  });
};

export const authRateLimiter = (req, res, next) => {
  const ip = req.ip || "unknown";

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "15 m"),
  });

  limiter.limit(ip).then((result) => {
    if (!result.success) {
      return res.status(429).json({
        success: false,
        message: "Too many auth attempts. Try again later.",
      });
    }

    next();
  });
};
