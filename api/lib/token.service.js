import jwt from "jsonwebtoken";
import { ENV } from "../config/env.js";
import { redisClient } from "./redis.js";

export const generateToken = (userId) => {
  const accessToken = jwt.sign({ userId }, ENV.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign({ userId }, ENV.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
};

export const storeRefreshToken = async (userId, refreshToken) => {
  const PROJECT_PREFIX = "ecommerce";

  try {
    const key = `${PROJECT_PREFIX}:user:${userId}:refreshToken`;

    const sevenDaysInSeconds = 7 * 24 * 60 * 60;

    await redisClient.set(key, refreshToken, {
      EX: sevenDaysInSeconds,
    });

    console.log(`Refresh token stored for user: ${userId}`);
  } catch (error) {
    console.error(`Error in storeRefreshToken: ${error}`);
    throw new Error(`Error in store refresh token`);
  }
};

export const setCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: ENV.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: ENV.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};
