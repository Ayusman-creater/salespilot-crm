import dotenv from "dotenv";
dotenv.config();

import validateEnv from "./config/validateEnv.js";
validateEnv();

import connectDB from "./config/db.js";
import app from "./app.js";

connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(
    `Server running on http://localhost:${PORT} [${process.env.NODE_ENV || "development"}]`
  )
);
