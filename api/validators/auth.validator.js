import { check } from "express-validator";
import User from "../db/models/user.model.js";
import validatorMiddleware from "../middlewares/validator.middleware.js";

export const signupValidator = [
  check("name").notEmpty().withMessage("Name is required").isLength({ min: 3 }).withMessage("Too short name"),

  check("username")
    .notEmpty()
    .withMessage("Username is required")
    .isLowercase()
    .withMessage("username is required lowercase")
    .isLength({ min: 3 })
    .withMessage("Too short name")
    .custom((val) =>
      User.findOne({ username: val }).then((user) => {
        if (user) {
          return Promise.reject(new Error("Username is already exist"));
        }
      })
    ),

  check("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email address")
    .custom((val) =>
      User.findOne({ email: val }).then((user) => {
        if (user) {
          return Promise.reject(new Error("Email already exists"));
        }
      })
    ),

  check("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be least 8 character long")
    .custom((password, { req }) => {
      if (password !== req.body.passwordConfirm) {
        throw new Error("Password Confirmation incorrect");
      }

      return true;
    }),

  check("passwordConfirm").notEmpty().withMessage("Passwordd Confirm is required"),

  validatorMiddleware,
];

export const loginValidator = [
  check("email").notEmpty().withMessage("Email is required").isEmail().withMessage("Email or password wrong"),

  check("password").notEmpty().withMessage("Password is required"),

  validatorMiddleware,
];
