import User from "../db/models/user.model.js";
import CustomError from "../lib/Error.js";
import Response from "../lib/Response.js";
import Comment from "../db/models/comment.model.js";
import Post from "../db/models/post.model.js";

export const createComment = async (req, res) => {
  try {
    const { postId, text } = req.body;
    const loggedInUserId = req.user._id;

    //Kullanici kontrolu
    const user = await User.findById(loggedInUserId);
    if (!user) {
      return res.status(404).json(Response.errorResponse(new CustomError("User not found", 404)));
    }

    //Post kontrolu
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json(Response.errorResponse(new CustomError("Post not found", 404)));
    }

    //Yorum metni kontrolu
    if (!text || text.trim() === "") {
      return res.status(400).json(Response.errorResponse(new CustomError("Comment text cannot be empty", 400)));
    }
    if (text.length > 256) {
      return res.status(400).json(Response.errorResponse(new CustomError("Comment is too long", 400)));
    }

    //Yeni bir yorum olusturuluyor
    const newComment = new Comment({
      post: postId,
      author: loggedInUserId,
      content: text,
    });

    await newComment.save();

    res.status(201).json(Response.successResponse(newComment, "Comment created successfully"));
  } catch (error) {
    console.log("Error in createComment: ", error);
    const response = Response.errorResponse(new CustomError("Internal Server Error", 500));
    return res.status(500).json(response);
  }
};
