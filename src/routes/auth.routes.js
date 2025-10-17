import Router from "express";
import {
  loginUserController,
  registerUserController,
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/signup", registerUserController);
router.post("/login", loginUserController);

export default router;
