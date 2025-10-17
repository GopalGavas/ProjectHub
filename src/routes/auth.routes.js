import Router from "express";
import { registerUserController } from "../controllers/auth.controller.js";

const router = Router();

router.post("/signup", registerUserController);

export default router;
