import Router from "express";
import {
  authenticateUser,
  authoriseRoles,
} from "../middlewares/auth.middleware.js";
import { createProjectController } from "../controllers/projects.controller.js";

const router = Router();

router.post(
  "/",
  authenticateUser,
  authoriseRoles("admin"),
  createProjectController
);

export default router;
