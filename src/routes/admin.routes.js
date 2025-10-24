import Router from "express";
import {
  authenticateUser,
  authoriseRoles,
} from "../middlewares/auth.middleware.js";
import {
  fetchUserByIdController,
  getAllUsersController,
  updateUserRoleController,
} from "../controllers/admin.controller.js";

const router = Router();

router.use(authenticateUser);
router.use(authoriseRoles("admin"));

router.get("/users/:id", fetchUserByIdController);
router.get("/users", getAllUsersController);
router.put("/users/:id", updateUserRoleController);

export default router;
