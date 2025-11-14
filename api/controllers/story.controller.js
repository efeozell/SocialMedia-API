import Story from "../db/models/story.model.js";
import User from "../db/models/user.model.js";
import CustomError from "../lib/Error.js";
import Response from "../lib/Response.js";

export const createStory = async (req, res) => {
  //Ilk olarak gelen istekteki kullanici bilgilerini ve gelen story verilerini aliyoruz
  try {
    const userId = req.user._id;
    const { text, image } = req.body;

    const newStory = new Story({
      user: userId,
      text,
      image,
    });

    await newStory.save();

    res.status(201).json({
      message: "Story created successfully!",
      data: newStory,
    });
  } catch (error) {
    console.log("Error in createStory: ", error);
    const response = Response.errorResponse(new CustomError(500, "Failed to create story", "CreateStoryError"));
    res.status(500).json(response);
  }
};

export const getAllStories = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).populate("following");
    if (!user) {
      return res.status(404).json(Response.errorResponse(new CustomError(404, "User not found", "UserNotFound")));
    }

    const followingIds = user.following.map((user) => user._id);
    followingIds.push(userId);

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const stories = await Story.find({ user: { $in: followingIds }, createdAt: { $gte: twentyFourHoursAgo } });

    if (!stories || stories.length === 0) {
      return res
        .status(404)
        .json(Response.errorResponse(new CustomError(404, "No stories found from followed users", "NoStoriesFound")));
    }

    res.status(200).json(Response.successResponse(stories, 200));
  } catch (error) {
    console.log("Error in createStory: ", error);
    const response = Response.errorResponse(new CustomError(500, "Failed to create story", "CreateStoryError"));
    res.status(500).json(response);
  }
};

export const getUserStories = async (req, res) => {
  try {
    const { userId } = req.params;
    const loggedInUserId = req.user._id;
    //Burada userId kullanarak kullanicinin storysini getiricez EGER userId bizi takip ediyorsa ve bizde onu takip ediyorsak gostericez
    const targetUser = await User.findById(userId).populate("following");
    const user = await User.findById(loggedInUserId).populate("followers");

    if (!targetUser || !user) {
      return res.status(404).json(Response.errorResponse(new CustomError(404, "User not found", "UserNotFound")));
    }

    if (userId === loggedInUserId.toString()) {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const stories = await Story.find({ user: userId, createdAt: { $gte: twentyFourHoursAgo } });
      if (!stories || stories.length === 0) {
        return res
          .status(404)
          .json(Response.errorResponse(new CustomError(404, "No stories found for this user", "NoStoriesFound")));
      }
      return res.status(200).json(Response.successResponse(stories, 200));
    }

    //Eger kullanici bizi takip etmiyorsa veya bizde onu takip etmiyorsak yada kullanici bizi takip ediyorsa biz onu takip etmiyorsa yada biz onu takip ediyorsak o bizi takip etmiyorsa hata
    const isFollower = user.followers.some((follower) => follower._id.toString() === userId);
    const isFollowing = targetUser.following.some((followed) => followed._id.toString() === loggedInUserId.toString());

    if (!isFollower || !isFollowing) {
      return res
        .status(403)
        .json(
          Response.errorResponse(
            new CustomError(403, "You are not authorized to view this user's stories", "UnauthorizedAccess")
          )
        );
    }

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const stories = await Story.find({ user: userId, createdAt: { $gte: twentyFourHoursAgo } });
    if (!stories || stories.length === 0) {
      return res
        .status(404)
        .json(Response.errorResponse(new CustomError(404, "No stories found for this user", "NoStoriesFound")));
    }

    res.status(200).json(Response.successResponse(stories, 200));
  } catch (error) {
    console.log("Error in getUserStories: ", error);
    const response = Response.errorResponse(
      new CustomError(500, "Failed to get story for user", "GetUserStoriesError")
    );
    res.status(500).json(response);
  }
};

export const deleteStoryById = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user._id;

    if (!storyId) {
      return res
        .status(400)
        .json(Response.errorResponse(new CustomError(400, "Story ID is required", "StoryIdRequired")));
    }
    //Gelen storyId'nin sahibi istegi atan kullanici mi?
    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json(Response.errorResponse(new CustomError(404, "Story not found", "StoryNotFound")));
    }

    if (story.user.toString() !== userId.toString()) {
      return res
        .status(403)
        .json(
          Response.errorResponse(
            new CustomError(403, "You are not authorized to delete this story", "UnauthorizedAccess")
          )
        );
    }

    await Story.findByIdAndDelete(storyId);

    res.status(200).json(Response.successResponse(200, "Story deleted successfully"));
  } catch (error) {
    console.log("Error in deleteStoryById: ", error);
    const response = Response.errorResponse(new CustomError(500, "Failed to delete story", "DeleteStoryError"));
    res.status(500).json(response);
  }
};
