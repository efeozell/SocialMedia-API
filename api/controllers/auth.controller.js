import jwt from "jsonwebtoken";
import User from "../db/models/user.model.js";
import CustomError from "../lib/Error.js";
import Response from "../lib/Response.js";
import { generateToken, setCookies, storeRefreshToken } from "../lib/token.service.js";
import { ENV } from "../config/env.js";
import { redisClient } from "../lib/redis.js";
import sendEmail from "../lib/SendEmail.js";
import crypto from "crypto";

export const signup = async (req, res, next) => {
  try {
    const { email, password, name, username } = req.body;

    const user = await User.create({
      name,
      username,
      email,
      password,
    });

    const verificationToken = user.createEmailVerificationToken();

    await user.save({ validateBeforeSave: false });

    const verificationURL = `${ENV.BASE_URL}/api/auth/verify-email/${verificationToken}`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Hesabinizi Dogrulayin",
        html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Hesabinizi Dogrulayin</h2>
                <p>Hesabinizi dogrulamak için aşağıdaki butona tıklayın:</p>
                <a href="${verificationURL}" style="background-color: #007bff; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">
                    Hesabı Doğrula
                </a>
                <p>Eğer bu link çalışmazsa, aşağıdaki adresi kopyalayıp tarayıcınıza yapıştırabilirsiniz:</p>
                <p>${verificationURL}</p>
            </div>`,
      });

      return res
        .status(201)
        .json(
          Response.successResponse(null, "User registered successfully. Please check yor email to verify your account")
        );
    } catch (emailError) {
      console.log("Email sending error: ", emailError);
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return next(new CustomError(500, "User registered, but email could not be send "));
    }
  } catch (error) {
    console.log(`Error in signup endpoint ${error}`);
    let errorResponse = Response.errorResponse(new CustomError(500, "Internal Server Error", "Internal Server Error"));
    return res.status(500).json(errorResponse);
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

export const refreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(400).json({ message: "No refresh token provided" });
    }

    const decoded = jwt.verify(refreshToken, ENV.REFRESH_TOKEN_SECRET);
    const storedToken = await redisClient.get(`ecommerce:user:${decoded.userId}:refreshToken`);

    if (storedToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const accessToken = jwt.sign({ userId: decoded.userId }, ENV.ACCESS_TOKEN_SECRET, {
      expiresIn: "15m",
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: ENV.NODE_ENV === "production",
      maxAge: 15 * 60 * 1000,
      sameSite: "strict",
    });

    res.json({ message: "Access token refreshed successfully" });
  } catch (error) {
    console.log(`Error in refresh token: ${error}`);
    let errorResponse = Response.errorResponse(new CustomError(500, "Internal Server Error", "Internal Server Error"));
    res.status(500).json(errorResponse);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const orginalToken = req.params.token;

    if (!orginalToken) {
      res.status(400).json({ message: "Verification token is missing." });
    }

    const hashedToken = crypto.createHash("sha256").update(orginalToken).digest("hex");

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Verification link is invalid or has expired." });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json(Response.successResponse(null, "Email verified successfully. You can now login"));
  } catch (error) {
    console.log("Error in verifyEmail: ", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
