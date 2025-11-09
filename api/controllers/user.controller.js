import User from "../db/models/user.model.js";
import CustomError from "../lib/Error.js";
import Response from "../lib/Response.js";
import { sanitizeUserProfile } from "../utils/sanitize_data.js";
import mongoose from "mongoose";

export const getUserByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const loggedInUserId = req.user._id.toString();

    if (userId === loggedInUserId) {
      return res
        .status(400)
        .json(
          Response.errorResponse(
            new CustomError(
              400,
              "Cannot fetch your own profile User /me endpoint",
              "Cannot fetch your own profile User /me endpoint"
            )
          )
        );
    }

    const user = await User.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $project: {
          username: 1,
          name: 1,
          email: 1,
          profilePicture: 1,
          bio: 1,
          followersCount: { $size: "$followers" },
          followingCount: { $size: "$following" },
        },
      },
    ]);
    if (!user || user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const loggedInUser = await User.findById(loggedInUserId).select("-password -__v");

    //eger kullanici blocList'de varsa kullanicinin profiline erisim yok
    if (loggedInUser.blockList.includes(userId)) {
      return res
        .status(403)
        .json(Response.errorResponse(new CustomError(403, "Access denied", "You cannot view this profile")));
    }

    const response = Response.successResponse(user[0], 200);
    res.status(200).json(response);
  } catch (error) {
    console.log("Error in getUserByUserId: ", error);
    const response = Response.errorResponse(new CustomError(500, "Internal Server Error", "Internal Server Error"));
    res.status(500).json(response);
  }
};

export const getUser = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.aggregate([
      {
        $match: { _id: userId },
      },
      {
        $project: {
          _id: 0,
          username: 1,
          name: 1,
          email: 1,
          profilePicture: 1,
          bio: 1,
          followersCount: { $size: "$followers" },
          followingCount: { $size: "$following" },
        },
      },
    ]);

    if (!user || user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const response = Response.successResponse(user[0]);
    res.status(200).json(response);
  } catch (error) {
    console.log("Error in getUser: ", error);
    const response = Response.errorResponse(new CustomError(500, "Internal Server Error", "Internal Server Error"));
    res.status(500).json(response);
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const updatedData = req.body;
    const usernameInUse = await User.findOne({ username: updatedData.username, _id: { $ne: req.user._id } });
    if (usernameInUse) {
      return res
        .status(400)
        .json(Response.errorResponse(new CustomError(400, "Username already in use", "Username already in use")));
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updatedData, { new: true });
    if (updatedUser) {
      return res.status(200).json(Response.successResponse(sanitizeUserProfile(updatedUser), 200));
    } else {
      return res.status(404).json(Response.errorResponse(new CustomError(404, "User not found", "User not found")));
    }
  } catch (error) {
    console.log("Error in updateUserProfile: ", error);
    const response = Response.errorResponse(new CustomError(500, "Internal Server Error", "Internal Server Error"));
    res.status(500).json(response);
  }
};

export const followUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const followingUserId = req.user._id;

    if (userId === followingUserId.toString()) {
      return res
        .status(400)
        .json(Response.errorResponse(new CustomError(400, "You cannot follow yourself", "You cannot follow yourself")));
    }

    const [userToFollow, loggedInUser] = await Promise.all([User.findById(userId), User.findById(followingUserId)]);

    if (!userToFollow || !loggedInUser) {
      return res.status(404).json(Response.errorResponse(new CustomError(404, "User not found", "User not found")));
    }

    if (loggedInUser.blockList.includes(userId) || userToFollow.blockList.includes(followingUserId.toString())) {
      return res
        .status(400)
        .json(Response.errorResponse(new CustomError(400, "Cannot follow this user", "Cannot follow this user")));
    }

    if (loggedInUser.following.includes(userId)) {
      return res
        .status(400)
        .json(
          Response.errorResponse(new CustomError(400, "Already following this user!", "Already following this user!"))
        );
    }

    await Promise.all([
      User.findByIdAndUpdate(followingUserId, {
        $addToSet: { following: userId },
      }),
      User.findByIdAndUpdate(userId, {
        $addToSet: { followers: followingUserId },
      }),
    ]);

    res.status(200).json({ message: "User successfully following!" });
  } catch (error) {
    console.log("Error in follow user: " + error);
    const response = Response.errorResponse(new CustomError(500, "Internal Server Error", "Internal Server Error"));
    res.status(500).json(response);
  }
};

export const unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const followingUserId = req.user._id;

    if (userId === followingUserId) {
      return res
        .status(400)
        .json(
          Response.errorResponse(new CustomError(400, "You cannot unfollow your self", "You cannot unfollow your self"))
        );
    }

    const [userToUnfollow, loggedInUser] = await Promise.all([User.findById(userId), User.findById(followingUserId)]);

    if (!userToUnfollow || !loggedInUser) {
      return res.status(404).json(Response.errorResponse(new CustomError(404, "User not found", "User not found")));
    }

    if (!loggedInUser.following.includes(userId)) {
      return res
        .status(400)
        .json(
          Response.errorResponse(
            new CustomError(400, "You are not following this user", "You are not following this user")
          )
        );
    }

    await Promise.all([
      User.findByIdAndUpdate(followingUserId, {
        $pull: { following: userId },
      }),
      User.findByIdAndUpdate(userId, {
        $pull: { followers: followingUserId },
      }),
    ]);

    const response = Response.successResponse({ message: "User unfollow successfully!" });

    res.status(200).json(response);
  } catch (error) {
    console.log("Error in unfollowUser: ", error);
    const response = Response.errorResponse(new CustomError(500, "Internal Server Error", "Internal Server Error"));
    res.status(500).json(response);
  }
};

export const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const blockingUserId = req.user._id;

    if (userId === blockingUserId.toString()) {
      return res
        .status(400)
        .json(Response.errorResponse(new CustomError(400, "You cannot block yourself", "You cannot block yourself")));
    }

    const [userToBlock, loggedInUser] = await Promise.all([User.findById(userId), User.findById(blockingUserId)]);

    if (!userToBlock || !loggedInUser) {
      return res.status(404).json(Response.errorResponse(new CustomError(404, "User not found", "User not found")));
    }

    if (loggedInUser.blockList.includes(userId)) {
      return res
        .status(400)
        .json(Response.errorResponse(new CustomError(400, "User already blocked", "User already blocked")));
    }

    await Promise.all([
      User.findByIdAndUpdate(blockingUserId, {
        $addToSet: { blockList: userId },
        $pull: { following: userId, followers: userId },
      }),

      User.findByIdAndUpdate(userId, {
        $pull: { following: blockingUserId, followers: blockingUserId },
      }),
    ]);

    res.status(200).json({ message: "User successfully blocked!" });
  } catch (error) {
    console.log("Error in blockUser: ", error);
    const response = Response.errorResponse(new CustomError(500, "Internal Server Error", "Internal Server Error"));
    res.status(500).json(response);
  }
};

export const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const loggedInUserId = req.user._id;

    if (userId === loggedInUserId.toString()) {
      return res
        .status(400)
        .json(
          Response.errorResponse(new CustomError(400, "You cannot unblock yourself", "You cannot unblock yourself"))
        );
    }

    const [userToUnblock, loggedInUser] = await Promise.all([
      User.findById(userId),
      User.findById(loggedInUserId.toString()),
    ]);

    if (!userToUnblock || !loggedInUser) {
      return res.status(404).json(Response.errorResponse(new CustomError(404, "User not found", "User not found")));
    }

    if (!loggedInUser.blockList.includes(userId)) {
      return res
        .status(400)
        .json(
          Response.errorResponse(
            new CustomError(400, "User is not in your block list", "User is not in your block list")
          )
        );
    }

    await Promise.all([
      User.findByIdAndUpdate(loggedInUserId, {
        $pull: { blockList: userId },
      }),
    ]);

    res.status(200).json({ message: "User successfully unblocked!" });
  } catch (error) {
    console.log("Error in unblockUser: ", error);
    const response = Response.errorResponse(new CustomError(500, "Internal Server Error", "Internal Server Error"));
    res.status(500).json(response);
  }
};

export const getBlockedUsers = async (req, res) => {
  try {
    const loggedInUserId = req.user._id.toString();

    const loggedInUser = await User.findById(loggedInUserId).populate("blockList", "-password -__v");
    if (!loggedInUser) {
      return res.status(404).json(Response.errorResponse(new CustomError(404, "User not found", "User not found")));
    }

    return res.status(200).json(Response.successResponse(loggedInUser.blockList, 200));
  } catch (error) {
    console.log("Error in getBlockedUsers: ", error);
    const response = Response.errorResponse(new CustomError(500, "Internal Server Error", "Internal Server Error"));
    res.status(500).json(response);
  }
};

export const searchUsers = async (req, res) => {
  try {
    const searchTerm = req.query.q;

    if (!searchTerm || searchTerm.length < 2) {
      return res
        .status(400)
        .json(
          Response.errorResponse(
            new CustomError(
              400,
              "Search term must be at least 2 characters long",
              "Search term must be at least 2 characters long"
            )
          )
        );
    }

    if (searchTerm.length > 10) {
      return res
        .status(400)
        .json(Response.errorResponse(new CustomError(400, "Search term is so long", "Search term is so long")));
    }

    const searchRegex = new RegExp(searchTerm, "i");

    const users = await User.find({
      $or: [{ username: searchRegex }, { email: searchRegex }],
    })
      .limit(10)
      .select("-password");

    const sanitizedUsers = users.map((user) => ({
      _id: user._id,
      name: user.name,
      username: user.username,
      profilePicture: user.profilePicture,
    }));

    res.status(200).json(Response.successResponse(sanitizedUsers, 200));
  } catch (error) {
    console.log("Error in searchUsers: ", error);
    const response = Response.errorResponse(new CustomError(500, "Internal Server Error", "Internal Server Error"));
    res.status(500).json(response);
  }
};
