import Notification from "../models/Notification.js";

export const notify = async ({ user, type, message, link = null }) => {
  try {
    await Notification.create({ user, type, message, link });
  } catch (err) {
    console.error("Notification create failed:", err.message);
  }
};
