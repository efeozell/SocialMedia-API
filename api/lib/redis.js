import { createClient } from "redis";
import { ENV } from "../config/env.js";

const redisClient = createClient({
  url: ENV.REDIS_URL,
});

redisClient.on("connect", () => console.log("Redis ready to connect"));
redisClient.on("ready", () => console.log("Redis connected successfully"));
redisClient.on("error", (err) => console.error("Redis connection error: ", err));

export const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error("Error connection redis: ", error);
    process.exit(1);
  }
};

export { redisClient };
