import jwt from "jsonwebtoken";
import User from "../db/models/user.model.js";
import CustomError from "../lib/Error.js";
import Response from "../lib/Response.js";
import { generateToken, setCookies, storeRefreshToken } from "../lib/token.service.js";
import { ENV } from "../config/env.js";
import { redisClient } from "../lib/redis.js";

export const signup = async (req, res, next) => {
  try {
    const { email, password, name, username } = req.body;

    const user = await User.create({
      name,
      username,
      email,
      password,
    });

    const response = Response.successResponse(user, 201);

    res.status(201).json(response);
  } catch (error) {
    console.log(`Error in signup endpoint ${error}`);
    console.log(`Error in login endpoint ${error}`);
    let errorResponse = Response.errorResponse(new CustomError(500, "Internal Server Error", "Internal Server Error"));
    res.status(500).json(errorResponse);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const saltPassword = await user.comparePassword(password);

    if (user && saltPassword) {
      const { accessToken, refreshToken } = generateToken(user._id);

      await storeRefreshToken(user._id, refreshToken);

      setCookies(res, accessToken, refreshToken);

      const response = Response.successResponse(user, 200);
      res.status(200).json(response);
    }

    if (!saltPassword) {
      let errorResponse = Response.errorResponse(
        new CustomError(400, "Invalid email or password", "Invalid email or password")
      );
      return res.status(400).json(errorResponse);
    }
  } catch (error) {
    console.log(`Error in login endpoint ${error}`);
    let errorResponse = Response.errorResponse(new CustomError(500, "Internal Server Error", "Internal Server Error"));
    res.status(500).json(errorResponse);
  }
};

export const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      const decoded = jwt.verify(refreshToken, ENV.REFRESH_TOKEN_SECRET);
      await redisClient.del(`ecommerce:user:${decoded.userId}:refreshToken`);
    } else if (!refreshToken) {
      let errorResponse = Response.errorResponse(
        new CustomError(400, "No refresh token provided", "No refresh token provided")
      );
      res.status(400).json(errorResponse);
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log(`Error in logout endpoint ${error}`);
    let errorResponse = Response.errorResponse(new CustomError(500, "Internal Server Error", "Internal Server Error"));
    res.status(500).json(errorResponse);
  }
};
