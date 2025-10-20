import Router from "express";
import { authenticateUser } from "../middlewares/auth.middleware.js";
import {
  getUserProfile,
  updateUserDetails,
} from "../controllers/user.controller.js";

const router = Router();

router.get("/", authenticateUser, getUserProfile);
router.put("/:id", authenticateUser, updateUserDetails);

export default router;
