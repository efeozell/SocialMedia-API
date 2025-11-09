import Response from "../lib/Response.js";
import CustomError from "../lib/Error.js";
import Post from "../db/models/post.model.js";
import User from "../db/models/user.model.js";
import Like from "../db/models/like.model.js";

export const createPost = async (req, res) => {
  try {
    const { header, images } = req.body;
    if (!header || !images) {
      return res
        .status(400)
        .json(Response.errorResponse(new CustomError(400, "Post field is required", "Post field is required")));
    }

    //Yeni post Post modelinden olusturuluyor.
    const newPost = new Post({
      header: header,
      images: images,
      author: req.user._id,
    });

    await newPost.save();

    res.status(201).json(Response.successResponse(newPost));
  } catch (error) {
    console.log("Error in createPost: ", error);
    const response = Response.errorResponse(new CustomError(500, "Internal Server Error", "Internal Server Error"));
    res.status(500).json(response);
  }
};

export const updatePost = async (req, res) => {
  //Burada post guncelleme islemi yapilacak, ancak bu istegi atan kullanicinin postun sahip olup olmadigini kontrol etmemiz gerekiyor.
  try {
    const userId = req.user._id;
    const { postId } = req.params;
    const { header, images } = req.body;

    if (!header || !images) {
      return res
        .status(400)
        .json(
          Response.errorResponse(
            new CustomError(
              400,
              "Header and images are required to update the post",
              "Header and images are required to update the post"
            )
          )
        );
    }

    // Önce postu bul
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json(Response.errorResponse(new CustomError(404, "Post not found", "Post not found")));
    }

    // Authorization kontrolü - güncelleme yapmadan önce
    if (!post.author.equals(userId)) {
      return res
        .status(403)
        .json(
          Response.errorResponse(
            new CustomError(
              403,
              "You are not authorized to update this post",
              "You are not authorized to update this post"
            )
          )
        );
    }

    // Yetki varsa güncelle
    post.header = header;
    post.images = images;
    await post.save();

    res.status(200).json(Response.successResponse(post));
  } catch (error) {
    console.log("Error in updatePost: ", error);
    const response = Response.errorResponse(new CustomError(500, "Internal Server Error", "Internal Server Error"));
    res.status(500).json(response);
  }
};

//Takip edilen kullanicilarin postlarini Like ve Comment ile birlikte getirir
export const getPostForFlow = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const user = await User.findById(loggedInUserId).select("following blockList");
    if (!user) {
      return res.status(404).json(Response.errorResponse(new CustomError(404, "User not found", "User not found")));
    }

    const authorsToShow = [loggedInUserId, ...user.following];
    const blockedUsers = user.blockList;

    const allPost = await Post.aggregate([
      {
        $match: {
          author: {
            $in: authorsToShow,
            $nin: blockedUsers,
          },
        },
      },
      { $sort: { createdAt: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "post",
          as: "likes",
        },
      },
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "post",
          as: "comments",
        },
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
        $project: {
          header: 1,
          images: 1,
          createdAt: 1,
          likeCount: { $size: "$likes" },
          commentCount: { $size: "$comments" },
          isLikedByLoggedInUser: {
            $in: [loggedInUserId, "$likes.user"],
          },
          author: { $arrayElemAt: ["$authorDetails", 0] },
        },
      },
      {
        $project: {
          "author.password": 0,
          "author.email": 0,
          "author.blockList": 0,
          "author.following": 0,
          "author.followers": 0,
          "author.updatedAt": 0,
          "author.__v": 0,
        },
      },
    ]);

    res.status(200).json(Response.successResponse(allPost));
  } catch (error) {
    console.log("Error in getPostForFlow: ", error);
    const response = Response.errorResponse(new CustomError(500, "Internal Server Error", "Internal Server Error"));
    res.status(500).json(response);
  }
};

//Kullaniciya ait postlari getirir (Block ve follow kontrolu middleware'de yapiliyor)
export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;

    // Kullanici var mi kontrol et
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(Response.errorResponse(new CustomError(404, "User not found", "User not found")));
    }

    // Kullanicinin postlarini getir
    const userPosts = await Post.aggregate([
      {
        $match: {
          author: user._id,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "post",
          as: "likes",
        },
      },
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "post",
          as: "comments",
        },
      },
      {
        $project: {
          header: 1,
          images: 1,
          createdAt: 1,
          updatedAt: 1,
          likeCount: { $size: "$likes" },
          commentCount: { $size: "$comments" },
          isLikedByUser: {
            $in: [req.user._id, "$likes.user"],
          },
        },
      },
    ]);

    res.status(200).json(Response.successResponse(userPosts));
  } catch (error) {
    console.log("Error in getUserPosts: ", error);
    const response = Response.errorResponse(new CustomError(500, "Internal Server Error", "Internal Server Error"));
    res.status(500).json(response);
  }
};

//Kullaniciya ait olan postu siler
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    if (!postId) {
      return res
        .status(400)
        .json(Response.errorResponse(new CustomError(400, "Post ID is required in URL", "Post ID is required in URL")));
    }

    const userId = req.user._id;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json(Response.errorResponse(new CustomError(404, "Post not found", "Post not found")));
    }

    if (!post.author.equals(userId)) {
      return res
        .status(403)
        .json(
          Response.errorResponse(
            new CustomError(
              403,
              "You are not authorized to delete this post",
              "You are not authorized to delete this post"
            )
          )
        );
    }

    await Like.deleteMany({ post: postId });
    await Comment.deleteMany({ post: postId });
    await Post.findByIdAndDelete(postId);

    res.status(200).json(Response.successResponse("Post deleted successfully"));
  } catch (error) {
    console.log("Error in deletePost: ", error);
    const response = Response.errorResponse(new CustomError(500, "Internal Server Error", "Internal Server Error"));
    res.status(500).json(response);
  }
};

//todo: Blok ve takip kontrolu eklenecek
export const likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;
    if (!postId) {
      return res
        .status(400)
        .json(Response.errorResponse(new CustomError(400, "Post ID is required in URL", "Post ID is required in URL")));
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json(Response.errorResponse(new CustomError(404, "Post not found", "Post not found")));
    }
    //Hali hazirda like atmi mi kontrol
    const existingLike = await Like.findOne({ post: postId, user: userId });
    if (existingLike) {
      return res
        .status(400)
        .json(
          Response.errorResponse(
            new CustomError(400, "You have already liked this post", "You have already liked this post")
          )
        );
    }

    const newLike = new Like({
      post: postId,
      user: userId,
    });

    await newLike.save();

    res.status(201).json(Response.successResponse("Post liked successfully"));
  } catch (error) {
    console.log("Error in likePost: ", error);
    const response = Response.errorResponse(new CustomError(500, "Internal Server Error", "Internal Server Error"));
    res.status(500).json(response);
  }
};

export const dislikePost = async (req, res) => {
  try {
    const { postId } = req.params;
    if (!postId) {
      return res
        .status(400)
        .json(Response.errorResponse(new CustomError(400, "Post ID is required in URL", "Post ID is required in URL")));
    }

    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json(Response.errorResponse(new CustomError(404, "Post not found", "Post not found")));
    }

    const existingLike = await Like.findOne({ post: postId, user: userId });
    if (!existingLike) {
      return res
        .status(400)
        .json(
          Response.errorResponse(
            new CustomError(400, "You have not liked this post yet", "You have not liked this post yet")
          )
        );
    }

    await Like.findByIdAndDelete(existingLike._id);

    res.status(200).json(Response.successResponse("Post unliked successfully"));
  } catch (error) {
    console.log("Error in dislikePost: ", error);
    const response = Response.errorResponse(new CustomError(500, "Internal Server Error", "Internal Server Error"));
    res.status(500).json(response);
  }
};
