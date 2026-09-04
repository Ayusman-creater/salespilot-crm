import express from "express";
import { register, login, logout, getMe } from "../controllers/public/auth.controller.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { registerValidator, loginValidator } from "../middleware/validators/authValidators.js";

// Public/global routes — no role required. Anyone can hit register/login;
// getMe just needs a valid session, not a specific role.
const router = express.Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new user (Sales Executive or Sales Manager only — Admin accounts must be created by an existing Admin)
 *     tags: [Public]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string, minLength: 6 }
 *               role: { type: string, enum: [Sales Manager, Sales Executive] }
 *     responses:
 *       201: { description: User created, JWT set as httpOnly cookie }
 *       400: { description: Validation error or email already exists }
 */
router.post("/auth/register", registerValidator, validate, register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Log in with email and password
 *     tags: [Public]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Logged in, JWT set as httpOnly cookie }
 *       401: { description: Invalid credentials }
 */
router.post("/auth/login", loginValidator, validate, login);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Log out (clears auth cookie)
 *     tags: [Public]
 *     responses:
 *       200: { description: Logged out }
 */
router.post("/auth/logout", logout);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Get the currently authenticated user
 *     tags: [Public]
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: Current user }
 *       401: { description: Not authenticated }
 */
router.get("/auth/me", protect, getMe);

export default router;
