import Router from "express";
import { authenticateUser } from "../middlewares/auth.middleware.js";
import {
  changePasswordController,
  getUserProfileController,
  updateUserDetailsController,
} from "../controllers/user.controller.js";

const router = Router();

router.use(authenticateUser);
router.get("/", getUserProfileController);
router.put("/update-details", updateUserDetailsController);
router.put("/change-password", changePasswordController);

export default router;
