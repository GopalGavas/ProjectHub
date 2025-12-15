import redis from "../db/redis.js";

export const setCache = async (key, value, ttl = 60) => {
  await redis.set(key, JSON.stringify(value), "EX", ttl);
};

export const getCache = async (key) => {
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
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
