import Router from "express";
import {
  authenticateUser,
  authoriseRoles,
} from "../middlewares/auth.middleware.js";
import {
  addMembersToProjectController,
  createProjectController,
  getAllProjectsController,
  getProjectByIdController,
  hardDeleteProjectController,
  removeMembersFromProjectController,
  restoreProjectController,
  softDeleteProjectController,
  updateProjectController,
} from "../controllers/projects.controller.js";
import taskRouter from "./task.routes.js";
import { getActivitiesByProjectController } from "../controllers/activity.controller.js";

const router = Router();

router.use(authenticateUser);

router.post(
  "/",

  authoriseRoles("admin"),
  createProjectController
);

router.get("/:id", getProjectByIdController);
router.get("/", getAllProjectsController);
router.put("/:id", updateProjectController);
router.put("/:id/deactivate", softDeleteProjectController);
router.put("/:id/restore", restoreProjectController);
router.post("/:id/members", addMembersToProjectController);
router.delete(
  "/:id/members",

  removeMembersFromProjectController
);
router.delete("/:id", hardDeleteProjectController);

router.get("/:projectId/activities", getActivitiesByProjectController);

router.use("/:projectId/tasks", taskRouter);

export default router;
