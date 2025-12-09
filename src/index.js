import "dotenv/config";
import express from "express";
import { applySecurity } from "./middlewares/security.middleware.js";
import {
  authRateLimiter,
  globalLimiter,
} from "./middlewares/rateLimiter.middleware.js";

const app = express();
const PORT = process.env.PORT || 8000;

applySecurity(app);
app.use("/api/auth", authRateLimiter);
app.use("/api", globalLimiter);

app.use((err, _, res, next) => {
  console.error("Error:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import projectRouter from "./routes/project.routes.js";
import adminRouter from "./routes/admin.routes.js";

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/projects", projectRouter);
app.use("/api/admin", adminRouter);
app.get("/health", (_, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

app.listen(PORT, () => {
  console.log(`Server is listening on PORT ${PORT}`);
});
