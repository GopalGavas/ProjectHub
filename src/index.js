import express from "express";

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());

import authRouter from "./routes/auth.routes.js";

app.use("/auth", authRouter);

app.listen(PORT, () => {
  console.log(`Server is listening on PORT ${PORT}`);
});
