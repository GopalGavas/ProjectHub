import Router from "express";
import {
  authenticateUser,
  authoriseRoles,
} from "../middlewares/auth.middleware.js";
import {
  softDeleteUserController,
  fetchUserByIdController,
  getAllUsersController,
  restoreUserController,
  updateUserRoleController,
  hardDeleteUserController,
} from "../controllers/admin.controller.js";
import { getActivitesByUserController } from "../controllers/activity.controller.js";

const router = Router();

router.use(authenticateUser);
router.use(authoriseRoles("admin"));

router.get("/users/:id", fetchUserByIdController);
router.get("/users", getAllUsersController);
router.put("/users/deactivate/:id", softDeleteUserController);
router.put("/users/restore/:id", restoreUserController);
router.put("/users/role/:id", updateUserRoleController);
router.delete("/users/delete/:id", hardDeleteUserController);
router.get("/users/:userId", getActivitesByUserController);

export default router;
