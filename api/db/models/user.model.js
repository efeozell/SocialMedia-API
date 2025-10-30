import mongoose from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"] },
    username: {
      type: String,
      required: [true, "Username is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be a least 8 character long"],
    },
    profilePicture: {
      type: String,
    },
    bio: {
      type: String,
      maxlength: 160,
    },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    isTwoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorCode: {
      type: String,
      select: false,
    },
    twoFactorCodeExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

//Pre save yaparak db'de kaydederken hashleyip kaydediyoruz
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.createEmailVerificationToken = function () {
  const verificationToken = crypto.randomBytes(32).toString("hex");

  this.emailVerificationToken = crypto.createHash("sha256").update(verificationToken).digest("hex");

  this.emailVerificationExpires = Date.now() + 15 * 60 * 1000;

  return verificationToken;
};

userSchema.methods.createTwoFactorCode = function () {
  const code = crypto.randomInt(100000, 1000000).toString();

  this.twoFactorCode = crypto.createHash("sha256").update(code).digest("hex");

  this.twoFactorCodeExpires = Date.now() + 10 * 60 * 1000;
  return code;
};

const User = mongoose.model("User", userSchema);

export default User;
