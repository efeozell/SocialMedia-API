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

    if (!targetUser) {
      return res.status(404).json(Response.errorResponse(new CustomError("Post author user not found", 404)));
    }

    if (!loggedInUserId.equals(targetUser._id)) {
      if (user.blockList.includes(targetUser._id) || targetUser.blockList.includes(user._id)) {
        return res
          .status(403)
          .json(Response.errorResponse(new CustomError("Forbidden: You cannot comment on this post", 403)));
      }

      if (!user.following.includes(targetUser._id) && !user.followers.includes(targetUser._id)) {
        return res
          .status(403)
          .json(Response.errorResponse(new CustomError("Forbidden: You cannot comment on this post", 403)));
      }
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

    if (!user.following.includes(targetUser._id) && !user.followers.includes(targetUser._id)) {
      return res
        .status(403)
        .json(Response.errorResponse(new CustomError("Forbidden: You cannot comment on this post", 403)));
    }

    if (!text || text.trim() === "") {
      return res.status(400).json(Response.errorResponse(new CustomError("Reply comment text cannot be empty", 400)));
    }

    if (text.length > 256) {
      return res.status(400).json(Response.errorResponse(new CustomError("Reply comment is too long", 400)));
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
    if (!user) {
      return res.status(404).json(Response.errorResponse(new CustomError("User not found", 404)));
    }
    const targetUser = await User.findById(comment.author);
    if (!targetUser) {
      return res.status(404).json(Response.errorResponse(new CustomError("Comment author user not found", 404)));
    }

    if (user.blockList.includes(targetUser._id) || targetUser.blockList.includes(user._id)) {
      return res
        .status(403)
        .json(Response.errorResponse(new CustomError("Forbidden: You cannot update this comment", 403)));
    }

    if (!user.following.includes(targetUser._id) && !user.followers.includes(targetUser._id)) {
      return res
        .status(403)
        .json(Response.errorResponse(new CustomError("Forbidden: You cannot comment on this post", 403)));
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

    const user = await User.findById(loggedInUserId);

    const replyComment = await Comment.findById(commentReplyId);
    if (!replyComment) {
      return res.status(404).json(Response.errorResponse(new CustomError("Reply comment not found", 404)));
    }

    const targetUser = await User.findById(replyComment.author);
    if (user.blockList.includes(targetUser._id) || targetUser.blockList.includes(user._id)) {
      return res
        .status(403)
        .json(Response.errorResponse(new CustomError("Forbidden: You cannot update this reply comment", 403)));
    }

    if (!replyComment.parentComment) {
      return res.status(400).json(Response.errorResponse(new CustomError("This is not a reply comment", 400)));
    }

    if (!user.following.includes(targetUser._id) && !user.followers.includes(targetUser._id)) {
      return res
        .status(403)
        .json(Response.errorResponse(new CustomError("Forbidden: You cannot comment on this post", 403)));
    }

    if (!replyComment.author.equals(loggedInUserId)) {
      return res
        .status(403)
        .json(Response.errorResponse(new CustomError("Forbidden: You can only update your own reply comments", 403)));
    }

    if (!text || text.trim() === "") {
      return res.status(400).json(Response.errorResponse(new CustomError("Reply comment text cannot be empty", 400)));
    }

    if (text.length > 256) {
      return res.status(400).json(Response.errorResponse(new CustomError("Reply comment is too long", 400)));
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

    if (!user.following.includes(targetUser._id) && !user.followers.includes(targetUser._id)) {
      return res
        .status(403)
        .json(Response.errorResponse(new CustomError("Forbidden: You cannot comment on this post", 403)));
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
    const user = await User.findById(loggedInUserId);

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json(Response.errorResponse(new CustomError("Comment not found", 404)));
    }

    const targetUser = await User.findById(comment.author);
    if (user.blockList.includes(targetUser._id) || targetUser.blockList.includes(user._id)) {
      return res
        .status(403)
        .json(Response.errorResponse(new CustomError("Forbidden: You cannot delete this comment", 403)));
    }

    if (!user.following.includes(targetUser._id) && !user.followers.includes(targetUser._id)) {
      return res
        .status(403)
        .json(Response.errorResponse(new CustomError("Forbidden: You cannot comment on this post", 403)));
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

    await CommentLike.deleteMany({ comment: commentId });
    if (isThereReplies) {
      const replyIds = await Comment.find({ parentComment: commentId }).distinct("_id");

      await CommentLike.deleteMany({ comment: { $in: replyIds } });
    }

    await Comment.findByIdAndDelete(commentId);

    res.status(200).json(Response.successResponse(null, "Comment successfully deleted"));
  } catch {
    const response = Response.errorResponse(new CustomError("Internal Server Error", 500));
    return res.status(500).json(response);
  }
};

//Ilgili postun ilgili yorumunu begenir
export const likeComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const loggedInUserId = req.user._id;

    // Kullanıcı kontrolü
    const user = await User.findById(loggedInUserId);
    if (!user) {
      return res.status(404).json(Response.errorResponse(new CustomError("User not found", 404)));
    }

    // Yorum kontrolü
    const comment = await Comment.findById(commentId).populate("author");
    if (!comment) {
      return res.status(404).json(Response.errorResponse(new CustomError("Comment not found", 404)));
    }

    // Yorum sahibini kontrol et
    const post = await Post.findById(comment.post);
    const postAuthor = await User.findById(post.author);

    if (user.blockList.includes(postAuthor._id) || postAuthor.blockList.includes(user._id)) {
      return res
        .status(403)
        .json(Response.errorResponse(new CustomError("Forbidden: You cannot like this comment", 403)));
    }

    // Zaten beğenilmiş mi kontrol et
    const existingLike = await CommentLike.findOne({
      comment: commentId,
      user: loggedInUserId,
    });
    if (existingLike) {
      return res.status(400).json(Response.errorResponse(new CustomError("You have already liked this comment", 400)));
    }

    // Yeni beğeni oluştur
    const newLike = new CommentLike({
      comment: commentId,
      user: loggedInUserId,
    });

    await newLike.save();

    res.status(200).json(Response.successResponse({ message: "Comment liked successfully" }));
  } catch {
    const response = Response.errorResponse(new CustomError("Internal Server Error", 500));
    return res.status(500).json(response);
  }
};

//Ilgili postun ilgili yorumunun begenisini kaldirir
export const dislikeComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const loggedInUserId = req.user._id;

    // Kullanıcı kontrolü
    const user = await User.findById(loggedInUserId);
    if (!user) {
      return res.status(404).json(Response.errorResponse(new CustomError("User not found", 404)));
    }

    // Yorum kontrolü
    const comment = await Comment.findById(commentId).populate("author");
    if (!comment) {
      return res.status(404).json(Response.errorResponse(new CustomError("Comment not found", 404)));
    }

    // Yorum sahibini kontrol et
    const commentAuthor = comment.author;
    if (!commentAuthor) {
      return res.status(404).json(Response.errorResponse(new CustomError("Comment author not found", 404)));
    }

    // Blok kontrolü - yorum sahibi ile
    if (user.blockList.includes(commentAuthor._id) || commentAuthor.blockList.includes(user._id)) {
      return res
        .status(403)
        .json(Response.errorResponse(new CustomError("Forbidden: You cannot unlike this comment", 403)));
    }

    if (!user.following.includes(commentAuthor._id) && !user.followers.includes(commentAuthor._id)) {
      return res
        .status(403)
        .json(Response.errorResponse(new CustomError("Forbidden: You cannot comment on this post", 403)));
    }

    // Beğeni var mı kontrol et ve sil
    const existingLike = await CommentLike.findOneAndDelete({
      comment: commentId,
      user: loggedInUserId,
    });
    if (!existingLike) {
      return res.status(400).json(Response.errorResponse(new CustomError("You have not liked this comment", 400)));
    }

    res.status(200).json(Response.successResponse({ message: "Comment unliked successfully" }));
  } catch {
    const response = Response.errorResponse(new CustomError("Internal Server Error", 500));
    return res.status(500).json(response);
  }
};
