import express from "express";
import { getUsers, createUser, updateUser } from "../controllers/admin/user.controller.js";
import { protect, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createUserValidator, updateUserValidator } from "../middleware/validators/userValidators.js";

// Admin-scoped routes. Every route here requires a valid session; most require
// the Admin role specifically. GET /users is opened to Sales Manager too since
// managers need the team list for lead/deal assignment dropdowns — the controller
// itself further restricts what a Manager can see (their own team, not everyone).
const router = express.Router();
router.use(protect);

/**
 * @openapi
 * /users:
 *   get:
 *     summary: List users (Admin sees all, Sales Manager sees their own team)
 *     tags: [Admin]
 *     responses:
 *       200: { description: List of users }
 *       403: { description: Sales Executive cannot list users }
 *   post:
 *     summary: Create a user with any role, including Admin (Admin only)
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string, minLength: 6 }
 *               role: { type: string, enum: [Admin, Sales Manager, Sales Executive] }
 *               manager: { type: string, description: "User ID of this user's manager (for Sales Executives)" }
 *     responses:
 *       201: { description: User created }
 *       403: { description: Only Admin can create users directly }
 */
router.route("/users")
  .get(authorize("Admin", "Sales Manager"), getUsers)
  .post(authorize("Admin"), createUserValidator, validate, createUser);

/**
 * @openapi
 * /users/{id}:
 *   put:
 *     summary: Update a user's role, manager, or active status (Admin only)
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: User updated }
 *       403: { description: Only Admin can update users }
 *       404: { description: User not found }
 */
router.put("/users/:id", authorize("Admin"), updateUserValidator, validate, updateUser);

export default router;
