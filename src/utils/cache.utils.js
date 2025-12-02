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
  const stream = redis.scanStream({
    match: pattern,
    count: 50,
  });

  return new Promise((resolve, reject) => {
    stream.on("data", (keys) => {
      stream.pause();

      Promise.resolve()
        .then(() => {
          if (keys.length) {
            return redis.del(...keys);
          }
        })
        .then(() => stream.resume())
        .catch((err) => {
          stream.destroy();
          reject(err);
        });
    });

    stream.on("end", resolve);
    stream.on("error", reject);
  });
};
