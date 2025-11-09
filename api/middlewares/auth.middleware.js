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

//Kullanicilarin birbirini engelleyip engellemedigini kontrol eden middleware
export const checkNotBlocked = async (req, res, next) => {
  const loggedInUserId = req.user._id;
  const targetUserId = req.params.userId;

  try {
    const loggedInUser = await User.findById(loggedInUserId).select("blockList");
    if (loggedInUser.blockList.includes(targetUserId)) {
      return next(res.status(403).json({ message: "Access Denied" }));
    }

    const targetUser = await User.findById(targetUserId).select("blockList");
    if (targetUser.blockList.includes(loggedInUserId)) {
      return next(res.status(403).json({ message: "Access Denied" }));
    }
  } catch (error) {
    console.log("Error in checkNotBlocked: " + error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
  next();
};

//Kullanicilarin birbirini takip edip etmedigini kontrol eden middleware
export const checkNotFollowing = async (req, res, next) => {
  const loggedInUserId = req.user._id;
  const targetUserId = req.params.userId;

  try {
    const loggedInUser = await User.findById(loggedInUserId).select("following");

    if (!loggedInUser.following.includes(targetUserId)) {
      return next(res.status(403).json({ message: "Access Denied" }));
    }

    const targetUser = await User.findById(targetUserId).select("following");
    if (!targetUser.following.includes(loggedInUserId)) {
      return next(res.status(403).json({ message: "Access Denied" }));
    }

    next();
  } catch (error) {
    console.log("Error in checkNotFollowing: " + error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
