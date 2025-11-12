import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

commentSchema.pre("save", async function (next) {
  if (this.parentComment) {
    if (this.parentComment.equals(this._id)) {
      throw new Error("Comment cannot reference itself as parent comment");
    }

    const parent = await mongoose.model("Comment").findById(this.parentComment);
    if (parent && !parent.post.equals(this.post)) {
      throw new Error("Parent comment must belong to the same post");
    }
  }
  next();
});

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;
