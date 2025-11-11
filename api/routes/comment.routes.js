import express from "express";
import { createComment } from "../controllers/comment.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/create", protectRoute, createComment);

export default router;
