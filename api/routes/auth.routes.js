import express from "express";
import { signup, login, logout, refreshToken, verifyEmail } from "../controllers/auth.controller.js";
import { signupValidator, loginValidator } from "../validators/auth.validator.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/signup", signupValidator, signup);
router.post("/login", loginValidator, login);
router.post("/logout", protectRoute, logout);
router.post("/refresh-token", refreshToken);
router.get("/verify-email/:token", verifyEmail);

//todo forgotPassword
//todo passwordReset

export default router;
