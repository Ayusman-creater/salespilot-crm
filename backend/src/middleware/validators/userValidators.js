import { body, param } from "express-validator";

export const createUserValidator = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("role")
    .isIn(["Admin", "Sales Manager", "Sales Executive"])
    .withMessage("Invalid role"),
  body("manager").optional({ values: "falsy" }).isMongoId().withMessage("Invalid manager id"),
];

export const updateUserValidator = [
  param("id").isMongoId().withMessage("Invalid user id"),
  body("role")
    .optional()
    .isIn(["Admin", "Sales Manager", "Sales Executive"])
    .withMessage("Invalid role"),
  body("isActive").optional().isBoolean().withMessage("isActive must be true/false"),
];
