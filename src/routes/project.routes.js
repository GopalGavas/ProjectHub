import Router from "express";
import {
  authenticateUser,
  authoriseRoles,
} from "../middlewares/auth.middleware.js";
import {
  createProjectController,
  getAllProjectsController,
  getProjectByIdController,
  updateProjectController,
} from "../controllers/projects.controller.js";

const router = Router();

router.post(
  "/",
  authenticateUser,
  authoriseRoles("admin"),
  createProjectController
);

router.get("/:id", authenticateUser, getProjectByIdController);
router.get("/", authenticateUser, getAllProjectsController);
router.put("/:id", authenticateUser, updateProjectController);

export default router;
