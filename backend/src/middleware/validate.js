import { validationResult } from "express-validator";

// Runs after an array of express-validator checks; if any failed, returns a clean
// 400 with all messages instead of letting a bad request hit the controller/DB.
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};
