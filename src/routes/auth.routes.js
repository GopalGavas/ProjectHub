import Router from "express";
import {
  loginUserController,
  logoutUserController,
  registerUserController,
} from "../controllers/auth.controller.js";
import { authenticateUser } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/signup", registerUserController);
router.post("/login", loginUserController);
router.post("/logout", authenticateUser, logoutUserController);

export default router;
