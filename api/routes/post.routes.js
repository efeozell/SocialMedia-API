import express from "express";
import { checkNotBlocked, checkNotFollowing, protectRoute } from "../middlewares/auth.middleware.js";
import {
  createPost,
  updatePost,
  getPostForFlow,
  getUserPosts,
  deletePost,
  likePost,
  dislikePost,
} from "../controllers/post.controller.js";

const router = express.Router();

router.post("/", protectRoute, createPost);
router.put("/update/:postId", protectRoute, updatePost);
router.get("/all", protectRoute, getPostForFlow); //Kullanicinin takip ettigi kullanicinin postlarini getirir Like ve Comment ile birlikte
router.get("/:userId", protectRoute, checkNotBlocked, checkNotFollowing, getUserPosts);
router.delete("/:postId", protectRoute, deletePost);

router.post("/like/:postId", protectRoute, likePost);
router.post("/dislike/:postId", protectRoute, dislikePost);
export default router;
