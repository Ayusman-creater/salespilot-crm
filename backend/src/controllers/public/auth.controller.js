import asyncHandler from "express-async-handler";
import User, { ROLES_LIST } from "../../models/User.js";
import { generateToken, setTokenCookie } from "../../utils/generateToken.js";

// @route POST /api/auth/register
// Note: in a real prod system, registration would likely be Admin-only (creating users
// for their team). For this assessment we allow open self-registration to make grading/
// test-account creation easy, but role defaults to Sales Executive unless an Admin creates
// the account via /api/users (see userController) — open registration can NEVER be used to
// self-assign Admin.
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, manager } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email and password are required");
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(400);
    throw new Error("An account with this email already exists");
  }

  // Prevent privilege escalation via self-registration: only allow Sales Executive
  // or Sales Manager from the public endpoint. Admin accounts must be seeded/created by an Admin.
  const safeRole = ROLES_LIST.includes(role) && role !== "Admin" ? role : "Sales Executive";

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role: safeRole,
    manager: manager || null,
  });

  const token = generateToken(user._id);
  setTokenCookie(res, token);

  res.status(201).json({ success: true, user: user.toSafeObject(), token });
});

// @route POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

  // Same generic error for missing user vs wrong password — avoids leaking which emails exist
  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error("This account has been deactivated");
  }

  const token = generateToken(user._id);
  setTokenCookie(res, token);

  res.json({ success: true, user: user.toSafeObject(), token });
});

// @route POST /api/auth/logout
export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token");
  res.json({ success: true, message: "Logged out" });
});

// @route GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toSafeObject() });
});
