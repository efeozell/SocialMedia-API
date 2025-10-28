import jwt from "jsonwebtoken";
import { ENV } from "../config/env.js";
import User from "../db/models/user.model.js";
import CustomError from "../lib/Error.js";

export const protectRoute = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const decoded = jwt.verify(accessToken, ENV.ACCESS_TOKEN_SECRET);
      const user = await User.findById(decoded.userId).select("-password");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      req.user = user;

      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Access token expired" });
      }

      throw error;
    }
  } catch (error) {
    console.log(`Error in protectRoute: ${error}`);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export const adminRoute = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ message: "Forbidden: Admins only" });
  }
};

export const checkEmailVerified = (req, res, next) => {
  if (req.user && !req.user.isEmailVerified) {
    return next(new CustomError(403, "Email Not Verified", "Please verify your email address!"));
  }
  next();
};
