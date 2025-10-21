import Router from "express";
import { authenticateUser } from "../middlewares/auth.middleware.js";
import {
  changePasswordController,
  getUserProfileController,
  updateUserDetailsController,
} from "../controllers/user.controller.js";

const router = Router();

router.get("/", authenticateUser, getUserProfileController);
router.put("/update-details", authenticateUser, updateUserDetailsController);
router.put("/change-password", authenticateUser, changePasswordController);

export default router;
