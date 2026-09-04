import asyncHandler from "express-async-handler";
import User, { ROLES_LIST } from "../../models/User.js";

// @route GET /api/users  (Admin, Sales Manager - for assignment dropdowns)
export const getUsers = asyncHandler(async (req, res) => {
  let filter = {};
  // Managers only see their own team + themselves for assignment purposes
  if (req.user.role === "Sales Manager") {
    filter = { $or: [{ manager: req.user._id }, { _id: req.user._id }] };
  }
  const users = await User.find(filter).select("name email role manager isActive").sort("name");
  res.json({ success: true, data: users });
});

// @route POST /api/users  (Admin only - the ONLY way to create an Admin or Sales Manager account)
export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, manager } = req.body;

  if (!name || !email || !password || !role) {
    res.status(400);
    throw new Error("Name, email, password and role are required");
  }

  if (!ROLES_LIST.includes(role)) {
    res.status(400);
    throw new Error("Invalid role");
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(400);
    throw new Error("A user with this email already exists");
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role,
    manager: manager || null,
  });

  res.status(201).json({ success: true, data: user.toSafeObject() });
});

// @route PUT /api/users/:id  (Admin only)
export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const { name, role, manager, isActive } = req.body;
  if (name) user.name = name;
  if (role && ROLES_LIST.includes(role)) user.role = role;
  if (manager !== undefined) user.manager = manager;
  if (isActive !== undefined) user.isActive = isActive;

  await user.save();
  res.json({ success: true, data: user.toSafeObject() });
});
