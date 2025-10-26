import express from "express";
import { signup, login, logout } from "../controllers/auth.controller.js";
import { signupValidator, loginValidator } from "../validators/auth.validator.js";

const router = express.Router();

router.post("/signup", signupValidator, signup);
router.post("/login", loginValidator, login);
router.post("/logout", logout);

export default router;
