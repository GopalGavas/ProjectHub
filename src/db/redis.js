import "dotenv/config";
import { Redis } from "@upstash/redis";

if (
  !process.env.UPSTASH_REDIS_REST_URL ||
  !process.env.UPSTASH_REDIS_REST_TOKEN
) {
  throw new Error("Upstash Redis environment variables are missing!");
}

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

console.log("Upstash Redis Connected 🟢");

export default redis;

// import "dotenv/config";
// import Redis from "ioredis";

// let redis;

// if (process.env.UPSTASH_REDIS_URL) {
//   redis = new Redis(process.env.UPSTASH_REDIS_URL, {
//     tls: {},
//   });
// } else {
//   redis = new Redis({
//     host: process.env.REDIS_HOST || "localhost",
//     port: process.env.REDIS_PORT || 6379,
//     password: process.env.REDIS_PASSWORD || undefined,
//     db: 0,
//     retryStrategy(times) {
//       const delay = Math.min(times * 50, 2000);
//       return delay;
//     },
//   });
// }

// redis.on("connect", () => {
//   console.log("Redis Connected 🟢");
// });

// redis.on("error", (err) => {
//   console.error("Redis Error ❌", err);
// });

// export default redis;
