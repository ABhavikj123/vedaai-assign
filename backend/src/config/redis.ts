import { Redis } from "ioredis";
import { env } from "./env.js";

const buildRedisClient = (name: string) => {
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    keepAlive: 30000,
    connectionName: `vedaai-${name}`,
    retryStrategy(times) {
      return Math.min(times * 250, 5000);
    },
    reconnectOnError(error) {
      const message = error.message.toLowerCase();
      return message.includes("read only") || message.includes("econnreset");
    }
  });

  let lastErrorLogAt = 0;

  client.on("connect", () => {
    console.log(`[redis:${name}] connecting`);
  });

  client.on("ready", () => {
    console.log(`[redis:${name}] ready`);
  });

  client.on("reconnecting", (delay: number) => {
    console.warn(`[redis:${name}] reconnecting in ${delay}ms`);
  });

  client.on("close", () => {
    console.warn(`[redis:${name}] connection closed`);
  });

  client.on("error", (error) => {
    const now = Date.now();
    if (now - lastErrorLogAt > 5000) {
      lastErrorLogAt = now;
      console.error(`[redis:${name}] ${error.message}`);
    }
  });

  return client;
};

export const redisConnection = buildRedisClient("queue");
export const cacheClient = buildRedisClient("cache");
