import { body, param } from "express-validator";

export const createActivityValidator = [
  body("type").isIn(["Call", "Email", "Meeting", "Demo", "Reminder"]).withMessage("Invalid activity type"),
  body("subject").trim().notEmpty().withMessage("subject is required"),
  body("dueDate").isISO8601().withMessage("dueDate must be a valid date"),
  body("relatedTo.kind").isIn(["Lead", "Customer", "Deal"]).withMessage("Invalid relatedTo.kind"),
  body("relatedTo.item").isMongoId().withMessage("relatedTo.item must be a valid id"),
];

export const updateActivityValidator = [
  param("id").isMongoId().withMessage("Invalid activity id"),
  body("status").optional().isIn(["Pending", "Completed", "Overdue"]).withMessage("Invalid status"),
  body("dueDate").optional().isISO8601().withMessage("dueDate must be a valid date"),
];
