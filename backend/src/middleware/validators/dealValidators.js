import { body, param } from "express-validator";

export const updateDealValidator = [
  param("id").isMongoId().withMessage("Invalid deal id"),
  body("value").optional().isFloat({ min: 0 }).withMessage("value must be a positive number"),
  body("probability")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("probability must be between 0 and 100"),
  body("expectedClosingDate")
    .optional()
    .isISO8601()
    .withMessage("expectedClosingDate must be a valid date"),
];

export const updateDealStageValidator = [
  param("id").isMongoId().withMessage("Invalid deal id"),
  body("stage")
    .isIn(["Qualification", "Discovery", "Proposal", "Negotiation", "Won", "Lost"])
    .withMessage("Invalid stage"),
];
