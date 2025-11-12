import express from "express";
import {
  createComment,
  createReplyComment,
  updateComment,
  updateReplyComment,
  getCommentsForPost,
  deleteComment,
  likeComment,
  dislikeComment,
} from "../controllers/comment.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();

//Yorum olustur
router.post("/create", protectRoute, createComment);

//Yoruma cevap ver
router.post("/create/reply/:commentId", protectRoute, createReplyComment);

//Yorumu duzenleme
router.put("/update/:commentId", protectRoute, updateComment);

//Yoruma atilan cevabi duzenleme
router.put("/update/reply/:commentReplyId", protectRoute, updateReplyComment);

//Postun butun yorumlarini getirme
router.get("/post/:postId", protectRoute, getCommentsForPost);

//Postun ilgili yorumunu silme
router.delete("/delete/:commentId", protectRoute, deleteComment);

router.post("/like/:commentId", protectRoute, likeComment);

router.delete("/dislike/:commentId", protectRoute, dislikeComment);

export default router;
