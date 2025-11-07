import mongoose from "mongoose";

export const sanitizeAuthUser = function (user) {
  return {
    id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    isTwoFactorEnabled: user.isTwoFactorEnabled,
  };
};

export const sanitizeUserProfile = function (user) {
  return {
    id: user._id,
    name: user.name,
    username: user.username,
    profilePicture: user.profilePicture,
    bio: user.bio,
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    blockList: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  };
};

export const sanitizeUserSearch = function (user) {
  return {
    name: user.name,
    username: user.username,
    profilePicture: user.profilePicture,
  };
};
