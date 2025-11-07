import express from "express";
import {
  getUserByUserId,
  getUser,
  updateUserProfile,
  followUser,
  unfollowUser,
  blockUser,
  unblockUser,
  getBlockedUsers,
  searchUsers,
} from "../controllers/user.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/me", protectRoute, getUser);
router.put("/me", protectRoute, updateUserProfile);
router.get("/blocked-users", protectRoute, getBlockedUsers);
router.get("/search", protectRoute, searchUsers);

router.get("/:userId", protectRoute, getUserByUserId);

router.post("/follow/:userId", protectRoute, followUser);
router.post("/unfollow/:userId", protectRoute, unfollowUser);

router.post("/block/:userId", protectRoute, blockUser);
router.post("/unblock/:userId", protectRoute, unblockUser);

export default router;
