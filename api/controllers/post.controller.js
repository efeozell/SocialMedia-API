import Response from "../lib/Response.js";
import CustomError from "../lib/Error.js";
import Post from "../db/models/post.model.js";

export const createPost = async (req, res) => {
  try {
    const { header, images } = req.body;
    if (!header || !images) {
      return res
        .status(400)
        .json(Response.errorResponse(new CustomError(400, "Post field is required", "Post field is required")));
    }

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
