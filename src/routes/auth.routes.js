import Router from "express";
import {
  loginUserController,
  logoutUserController,
  registerUserController,
  generateResetPassTokenController,
  resetPasswordController,
} from "../controllers/auth.controller.js";
import { authenticateUser } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/signup", registerUserController);
router.post("/login", loginUserController);
router.post("/logout", authenticateUser, logoutUserController);
router.post("/forgot-password", generateResetPassTokenController);
router.post("/reset-password/:token", resetPasswordController);

export default router;
