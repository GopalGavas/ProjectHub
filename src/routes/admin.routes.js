import Router from "express";
import {
  authenticateUser,
  authoriseRoles,
} from "../middlewares/auth.middleware.js";
import {
  deleteUserController,
  fetchUserByIdController,
  getAllUsersController,
  restoreUserController,
  updateUserRoleController,
} from "../controllers/admin.controller.js";

const router = Router();

router.use(authenticateUser);
router.use(authoriseRoles("admin"));

router.get("/users/:id", fetchUserByIdController);
router.get("/users", getAllUsersController);
router.put("/users-delete/:id", deleteUserController);
router.put("/users-restore/:id", restoreUserController);
router.put("/users/:id", updateUserRoleController);

export default router;
