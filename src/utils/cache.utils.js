import redis from "../db/redis.js";
import logger from "./logger.js";

export const setCache = async (key, value, ttl = 60) => {
  const safeValue = typeof value === "string" ? value : JSON.stringify(value);

  await redis.set(key, safeValue, { ex: ttl });
};

export const getCache = async (key) => {
  const data = await redis.get(key);
  if (!data) return null;

  try {
    return JSON.parse(data);
  } catch (err) {
    logger.error({ key, err }, "Invalid JSON in cache");
    await redis.del(key); // auto-heal
    return null;
  }
};

export const deleteCache = async (key) => {
  await redis.del(key);
};

export const deleteCachePatterns = async (pattern) => {
  let cursor = 0;

  do {
    const [nextCursor, keys] = await redis.scan(cursor, {
      match: pattern,
      count: 50,
    });

    if (keys.length > 0) {
      await redis.del(...keys);
    }

    cursor = Number(nextCursor);
  } while (cursor !== 0);
};
