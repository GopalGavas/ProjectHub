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
  removeMembersFromProjectController,
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
router.post("/:id/members", authenticateUser, addMembersToProjectController);
router.delete(
  "/:id/members",
  authenticateUser,
  removeMembersFromProjectController
);

export default router;
