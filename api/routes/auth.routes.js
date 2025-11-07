import express from "express";
import {
  signup,
  login,
  logout,
  refreshToken,
  verifyEmail,
  enable2fa,
  verify2fa,
  forgotPassword,
} from "../controllers/auth.controller.js";
import { signupValidator, loginValidator } from "../validators/auth.validator.js";
import { protectRoute, checkEmailVerified } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/signup", signupValidator, signup);
router.post("/login", loginValidator, login);
router.post("/logout", protectRoute, logout);
router.post("/refresh-token", refreshToken);
router.post("/enable-2fa", protectRoute, enable2fa);
router.post("/verify-2fa", verify2fa);
router.post("/reset-password", protectRoute, checkEmailVerified, forgotPassword);
router.get("/verify-email/:token", verifyEmail);

//TODO: Bu endpointleri diyagram ile acikla.

export default router;
