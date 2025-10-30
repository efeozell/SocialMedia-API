import jwt from "jsonwebtoken";
import User from "../db/models/user.model.js";
import CustomError from "../lib/Error.js";
import Response from "../lib/Response.js";
import { generateToken, setCookies, storeRefreshToken } from "../lib/token.service.js";
import { ENV } from "../config/env.js";
import { redisClient } from "../lib/redis.js";
import sendEmail from "../lib/SendEmail.js";
import crypto from "crypto";
import bcrypt from "bcrypt";

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

    //(Two-Factor Authentication - 2FA

    const saltPassword = await user.comparePassword(password);

    if (user && saltPassword) {
      if (user.isTwoFactorEnabled) {
        const twoFactorCode = user.createTwoFactorCode();

        await user.save({ validateBeforeSave: false });

        try {
          await sendEmail({
            email: user.email,
            subject: "Giris Dogrulama Kodunuz",
            message: `Giris yapmak icin dogrulama kodunuz: ${twoFactorCode}`,
          });
        } catch (emailError) {
          console.log("emailError in login endpoint: ", emailError);
          return next(new CustomError(500, "Could not send 2FA code. Please try again"));
        }

        return res.status(200).json({
          status: "2fa_required",
          message: "Please enter the 2FA code sent to your email",
          userId: user._id,
        });
      }

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

export const enable2fa = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.user._id, { isTwoFactorEnabled: true }, { new: true });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Two-Factor Authentication - 2FA Successfully Enabled" });
  } catch (error) {
    console.log(`Error in enable2fa endpoint ${error}`);
    let errorResponse = Response.errorResponse(new CustomError(500, "Internal Server Error", "Internal Server Error"));
    res.status(500).json(errorResponse);
  }
};

export const verify2fa = async (req, res, next) => {
  try {
    const { twoFactorCode, userId } = req.body;

    if (!twoFactorCode || !userId) {
      return res.status(400).json({ message: "userId and twoFactorCode are required" });
    }

    const user = await User.findOne({ _id: userId }).select("+twoFactorCode +twoFactorCodeExpires");
    if (!user || !user.isTwoFactorEnabled) {
      return res.status(400).json({ message: "User not found or 2FA is not enabled" });
    }

    if (!user.twoFactorCode || !user.twoFactorCodeExpires || user.twoFactorCodeExpires <= Date.now()) {
      return res.status(401).json({ message: "Two factor code is invalid or has expired" });
    }

    const hashedCode = crypto.createHash("sha256").update(twoFactorCode).digest("hex");

    const codeBuffer = Buffer.from(hashedCode);
    const userCodeBuffer = Buffer.from(user.twoFactorCode);

    if (codeBuffer.length !== userCodeBuffer.length) {
      return res.status(401).json({ message: "Two factor code is invalid or has expired" });
    }

    const codesMatch = crypto.timingSafeEqual(codeBuffer, userCodeBuffer);
    const timeIsValid = user.twoFactorCodeExpires > Date.now();

    if (codesMatch && timeIsValid) {
      user.twoFactorCode = undefined;
      user.twoFactorCodeExpires = undefined;

      await user.save({ validateBeforeSave: false });

      const { accessToken, refreshToken } = generateToken(user._id);

      await storeRefreshToken(user._id, refreshToken);

      setCookies(res, accessToken, refreshToken);

      const response = Response.successResponse(user, 200);

      res.status(200).json({ message: "Login successful", response });
    } else {
      return res.status(401).json({ message: "Two factor code is invalid or has expired. " });
    }
  } catch (error) {
    console.log(`Error in verify2fa endpoint ${error}`);
    let errorResponse = Response.errorResponse(new CustomError(500, "Internal Server Error", "Internal Server Error"));
    res.status(500).json(errorResponse);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { password, confirmPassword } = req.body;
    if (!password || !confirmPassword) {
      return res.status(400).json({ message: "Password or confirmPassword required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    user.password = password;
    await user.save();

    res.status(200).json({ message: "Password changed successfully!" });
  } catch (error) {
    console.log(`Error in forgotPassword endpoint ${error}`);
    let errorResponse = Response.errorResponse(new CustomError(500, "Internal Server Error", "Internal Server Error"));
    res.status(500).json(errorResponse);
  }
};
