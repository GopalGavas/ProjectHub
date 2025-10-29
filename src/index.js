import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use(cookieParser());

import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import projectRouter from "./routes/project.routes.js";
import adminRouter from "./routes/admin.routes.js";

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/projects", projectRouter);
app.use("/api/admin", adminRouter);

app.listen(PORT, () => {
  console.log(`Server is listening on PORT ${PORT}`);
});
