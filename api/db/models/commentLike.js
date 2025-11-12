import mongoose from "mongoose";

const commentLikeSchema = new mongoose.Schema(
  {
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

commentLikeSchema.index({ comment: 1, user: 1 }, { unique: true });

const CommentLike = mongoose.model("CommentLike", commentLikeSchema);

export default CommentLike;
