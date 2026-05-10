import redis from "../db/redis.js";
import logger from "./logger.js";

export const setCache = async (key, value, ttl = 60) => {
  try {
    const safeValue = typeof value === "string" ? value : JSON.stringify(value);
    await redis.set(key, safeValue, { ex: ttl });
  } catch (err) {
    logger.error({ key, err: err.message }, "Redis setCache failed");
  }
};

export const getCache = async (key) => {
  try {
    const data = await redis.get(key);
    if (!data) return null;

    try {
      return JSON.parse(data);
    } catch (err) {
      logger.error({ key, err: err.message }, "Invalid JSON in cache");
      await redis.del(key);
      return null;
    }
  } catch (err) {
    logger.error({ key, err: err.message }, "Redis getCache failed");
    return null;
  }
};

export const deleteCache = async (key) => {
  try {
    await redis.del(key);
  } catch (err) {
    logger.error({ key, err: err.message }, "Redis deleteCache failed");
  }
};

export const deleteCachePatterns = async (pattern) => {
  try {
    let cursor = 0;

    do {
      const [nextCursor, keys] = await redis.scan(cursor, {
        match: pattern,
        count: 50,
      });

      if (keys && keys.length > 0) {
        await redis.del(...keys);
      }

      cursor = Number(nextCursor);
    } while (cursor !== 0);
  } catch (err) {
    logger.error({ pattern, err: err.message }, "Redis deleteCachePatterns failed");
  }
};
