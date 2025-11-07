import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { createPost } from "../controllers/post.controller.js";

const router = express.Router();

router.post("/", protectRoute, createPost);

export default router;
