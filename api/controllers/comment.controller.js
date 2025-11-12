import mongoose from "mongoose";
import User from "../db/models/user.model.js";
import CustomError from "../lib/Error.js";
import Response from "../lib/Response.js";
import Comment from "../db/models/comment.model.js";
import Post from "../db/models/post.model.js";
import CommentLike from "../db/models/commentLike.js";

//Ilgili posta yorum ekler
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

    const targetUser = await User.findById(post.author);

    if (user.blockList.includes(targetUser._id) || targetUser.blockList.includes(user._id)) {
      return res
        .status(403)
        .json(Response.errorResponse(new CustomError("Forbidden: You cannot comment on this post", 403)));
    }

    if (!text || text.trim() === "") {
      //Yorum metni kontrolu
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
  } catch {
    const response = Response.errorResponse(new CustomError("Internal Server Error", 500));
    return res.status(500).json(response);
  }
};

//Ilgili postun yorumuna cevap ekler
export const createReplyComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;
    const loggedInUserId = req.user._id;

    const user = await User.findById(loggedInUserId);
    if (!user) {
      return res.status(404).json(Response.errorResponse(new CustomError("User not found", 404)));
    }

    const parentComment = await Comment.findById(commentId).select("post author");
    if (!parentComment) {
      return res.status(404).json(Response.errorResponse(new CustomError("Parent comment not found", 404)));
    }

    // Author field'ının var olduğundan emin ol
    if (!parentComment.author) {
      return res.status(400).json(Response.errorResponse(new CustomError("Comment author not found", 400)));
    }

    const targetUser = await User.findById(parentComment.author);
    if (!targetUser) {
      return res.status(404).json(Response.errorResponse(new CustomError("Comment author user not found", 404)));
    }

    if (user.blockList.includes(targetUser._id) || targetUser.blockList.includes(user._id)) {
      return res
        .status(403)
        .json(Response.errorResponse(new CustomError("Forbidden: You cannot reply to this comment", 403)));
    }

    const newReply = await Comment.create({
      content: text,
      author: loggedInUserId,
      post: parentComment.post,
      parentComment: commentId,
    });

    res.status(201).json(Response.successResponse(newReply, 201));
  } catch {
    const response = Response.errorResponse(new CustomError("Internal Server Error", 500));
    return res.status(500).json(response);
  }
};

//Ilgili postun ilgili yorumunu gunceller
export const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;
    const loggedInUserId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json(Response.errorResponse(new CustomError("Comment not found", 404)));
    }
    const user = await User.findById(loggedInUserId);
    const targetUser = await User.findById(comment.author);

    if (user.blockList.includes(targetUser._id) || targetUser.blockList.includes(user._id)) {
      return res
        .status(403)
        .json(Response.errorResponse(new CustomError("Forbidden: You cannot update this comment", 403)));
    }

    if (!comment.author.equals(loggedInUserId)) {
      return res
        .status(403)
        .json(Response.errorResponse(new CustomError("Forbidden: You can only update your own comments", 403)));
    }

    if (!text || text.trim() === "") {
      return res.status(400).json(Response.errorResponse(new CustomError("Comment text cannot be empty", 400)));
    }

    if (text.length > 256) {
      return res.status(400).json(Response.errorResponse(new CustomError("Comment is too long", 400)));
    }

    // Yetki kontrolü geçti, direkt güncelle
    comment.content = text;
    const updatedComment = await comment.save();

    res.status(200).json(Response.successResponse(updatedComment));
  } catch {
    const response = Response.errorResponse(new CustomError("Internal Server Error", 500));
    return res.status(500).json(response);
  }
};

//Ilgili postun ilgili yorumunun cevabini gunceller
export const updateReplyComment = async (req, res) => {
  try {
    const { commentReplyId } = req.params;
    const { text } = req.body;
    const loggedInUserId = req.user._id;

    const replyComment = await Comment.findById(commentReplyId);
    if (!replyComment) {
      return res.status(404).json(Response.errorResponse(new CustomError("Reply comment not found", 404)));
    }

    if (!replyComment.author.equals(loggedInUserId)) {
      return res
        .status(403)
        .json(Response.errorResponse(new CustomError("Forbidden: You can only update your own reply comments", 403)));
    }

    if (!text || text.trim() === "" || text.length > 256) {
      return res.status(400).json(Response.errorResponse(new CustomError("Reply comment text cannot be empty", 400)));
    }

    replyComment.content = text;
    const updatedReplyComment = await replyComment.save();

    res.status(200).json(Response.successResponse(updatedReplyComment));
  } catch {
    const response = Response.errorResponse(new CustomError("Internal Server Error", 500));
    return res.status(500).json(response);
  }
};

//Posta ait tum yorumlari getir
export const getCommentsForPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const loggedInUserId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json(Response.errorResponse(new CustomError("Post not found", 404)));
    }
    const user = await User.findById(loggedInUserId);
    const targetUser = await User.findById(post.author);

    if (user.blockList.includes(targetUser._id) || targetUser.blockList.includes(user._id)) {
      return res
        .status(403)
        .json(Response.errorResponse(new CustomError("Forbidden: You cannot view comments on this post", 403)));
    }

    // Toplam yorum sayısını al (blok kontrolü ile)
    const totalCommentsCount = await Comment.countDocuments({
      post: new mongoose.Types.ObjectId(postId),
    });

    const comments = await Comment.aggregate([
      {
        $match: { post: new mongoose.Types.ObjectId(postId) },
      },
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "authorDetails",
        },
      },
      {
        $unwind: "$authorDetails",
      },
      {
        $project: {
          _id: 1,
          post: 1,
          content: 1,
          parentComment: 1,
          createdAt: 1,
          updatedAt: 1,
          "authorDetails._id": 1,
          "authorDetails.username": 1,
          "authorDetails.profilePicture": 1,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    // Yorumlar yoksa bile total count döndür
    res.status(200).json(
      Response.successResponse({
        postId,
        comments: comments || [],
        totalComments: totalCommentsCount,
        displayedComments: comments ? comments.length : 0,
      })
    );
  } catch {
    const response = Response.errorResponse(new CustomError("Internal Server Error", 500));
    return res.status(500).json(response);
  }
};

//Ilgili postun ilgili yorumunu siler
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const loggedInUserId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json(Response.errorResponse(new CustomError("Comment not found", 404)));
    }

    if (!comment.author.equals(loggedInUserId)) {
      return res
        .status(403)
        .json(Response.errorResponse(new CustomError("Forbidden: You can only delete your own comments", 403)));
    }

    const isThereReplies = await Comment.findOne({ parentComment: commentId });
    if (isThereReplies) {
      await Comment.deleteMany({ parentComment: commentId });
    }

    await Comment.findByIdAndDelete(commentId);

    res.status(200).json(Response.successResponse(null, "Comment successfully deleted"));
  } catch (error) {
    console.log("Error in deleteComment: ", error);
    const response = Response.errorResponse(new CustomError("Internal Server Error", 500));
    return res.status(500).json(response);
  }
};

//Ilgili postun ilgili yorumunu begenir
export const likeComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const loggedInUserId = req.user._id;
    const user = await User.findById(loggedInUserId);

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json(Response.errorResponse(new CustomError("Comment not found", 404)));
    }
    const post = await Post.findById(comment.post);
    if (!post) {
      return res.status(404).json(Response.errorResponse(new CustomError("Post not found", 404)));
    }

    const targetUser = await User.findById(post.author);
    if (!targetUser) {
      return res.status(404).json(Response.errorResponse(new CustomError("Post author user not found", 404)));
    }

    if (user.blockList.includes(targetUser._id) || targetUser.blockList.includes(user._id)) {
      return res
        .status(403)
        .json(Response.errorResponse(new CustomError("Forbidden: You cannot like this comment", 403)));
    }

    if (!user.following.includes(targetUser._id) || !targetUser.following.includes(user._id)) {
      return res
        .status(403)
        .json(Response.errorResponse(new CustomError("Forbidden: You cannot like this comment", 403)));
    }

    const existingLike = await CommentLike.findOne({
      comment: commentId,
      user: loggedInUserId,
    });
    if (existingLike) {
      return res.status(409).json(Response.errorResponse(new CustomError("You have already liked this comment", 409)));
    }

    const newLike = new CommentLike({
      comment: commentId,
      user: loggedInUserId,
      post: comment.post,
    });

    await newLike.save();

    res.status(201).json(Response.successResponse(newLike, "Comment liked successfully"));
  } catch (error) {
    console.log("Error in likeComment: ", error);
    const response = Response.errorResponse(new CustomError("Internal Server Error", 500));
    return res.status(500).json(response);
  }
};

//Ilgili postun ilgili yorumunun begenisini kaldirir
export const dislikeComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const loggedInUserId = req.user._id;
    const user = await User.findById(loggedInUserId);

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json(Response.errorResponse(new CustomError("Comment not found", 404)));
    }
    const post = await Post.findById(comment.post);
    if (!post) {
      return res.status(404).json(Response.errorResponse(new CustomError("Post not found", 404)));
    }

    const targetUser = await User.findById(post.author);
    if (!targetUser) {
      return res.status(404).json(Response.errorResponse(new CustomError("Post author user not found", 404)));
    }

    if (user.blockList.includes(targetUser._id) || targetUser.blockList.includes(user._id)) {
      return res
        .status(403)
        .json(Response.errorResponse(new CustomError("Forbidden: You cannot like this comment", 403)));
    }

    if (!user.following.includes(targetUser._id) || !targetUser.following.includes(user._id)) {
      return res
        .status(403)
        .json(Response.errorResponse(new CustomError("Forbidden: You cannot like this comment", 403)));
    }

    const existingLike = await CommentLike.findOneAndDelete({
      comment: commentId,
      user: loggedInUserId,
    });
    if (!existingLike) {
      return res.status(404).json(Response.errorResponse(new CustomError("You have not liked this comment", 404)));
    }

    res.status(200).json(Response.successResponse(null, "Comment unliked successfully"));
  } catch (error) {
    console.log("Error in dislikeComment: ", error);
    const response = Response.errorResponse(new CustomError("Internal Server Error", 500));
    return res.status(500).json(response);
  }
};

//:TODO Like comment yapilacak
