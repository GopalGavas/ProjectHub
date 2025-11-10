import { Router } from "express";
import {
  createTaskController,
  getTaskByIdController,
  updateTaskController,
  updateTaskStatusController,
} from "../controllers/task.controller.js";

const taskRouter = Router({ mergeParams: true });

taskRouter.post("/", createTaskController);
taskRouter.get("/:taskId", getTaskByIdController);
taskRouter.put("/:taskId", updateTaskController);
taskRouter.put("/:taskId/status", updateTaskStatusController);

export default taskRouter;
