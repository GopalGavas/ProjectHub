import "dotenv/config";
import express from "express";
import { applySecurity } from "./middlewares/security.middleware.js";
import {
  authRateLimiter,
  globalLimiter,
} from "./middlewares/rateLimiter.middleware.js";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 8000;

app.use(
  cors({
    origin: process.env.CORS_FRONTEND_URL,
    credentials: true,
  })
);

applySecurity(app);

app.set("trust proxy", 1);

app.use("/api/auth", authRateLimiter);
app.use("/api", globalLimiter);

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

app.use((err, _, res, next) => {
  console.error("Error:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

app.listen(PORT, () => {
  console.log(`Server is listening on PORT ${PORT}`);
});
