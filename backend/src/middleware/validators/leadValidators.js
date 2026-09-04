import { body, param } from "express-validator";

export const createLeadValidator = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("source")
    .isIn(["Website", "Referral", "Social Media", "Email", "Phone"])
    .withMessage("Invalid lead source"),
  body("email").optional({ values: "falsy" }).isEmail().withMessage("Invalid email"),
  body("priority").optional().isIn(["Low", "Medium", "High"]).withMessage("Invalid priority"),
];

export const updateLeadValidator = [
  param("id").isMongoId().withMessage("Invalid lead id"),
  body("status")
    .optional()
    .isIn(["New", "Contacted", "Qualified", "Unqualified", "Converted", "Lost"])
    .withMessage("Invalid status"),
  body("priority").optional().isIn(["Low", "Medium", "High"]).withMessage("Invalid priority"),
  body("email").optional({ values: "falsy" }).isEmail().withMessage("Invalid email"),
];

export const assignLeadValidator = [
  param("id").isMongoId().withMessage("Invalid lead id"),
  body("assignedTo").isMongoId().withMessage("assignedTo must be a valid user id"),
];

export const addNoteValidator = [
  param("id").isMongoId().withMessage("Invalid lead id"),
  body("text").trim().notEmpty().withMessage("Note text is required"),
];

export const convertLeadValidator = [
  param("id").isMongoId().withMessage("Invalid lead id"),
  body("dealTitle").trim().notEmpty().withMessage("dealTitle is required"),
  body("dealValue").isFloat({ min: 0 }).withMessage("dealValue must be a positive number"),
  body("dealProbability")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("dealProbability must be between 0 and 100"),
  body("expectedClosingDate").isISO8601().withMessage("expectedClosingDate must be a valid date"),
];
