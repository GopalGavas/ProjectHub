import { Router } from "express";
import {
  createTaskController,
  getTaskByIdController,
  softDeleteTaskController,
  updateTaskController,
  updateTaskStatusController,
} from "../controllers/task.controller.js";

const taskRouter = Router({ mergeParams: true });

taskRouter.post("/", createTaskController);
taskRouter.get("/:taskId", getTaskByIdController);
taskRouter.put("/:taskId", updateTaskController);
taskRouter.put("/:taskId/status", updateTaskStatusController);
taskRouter.put("/:taskId/delete", softDeleteTaskController);

export default taskRouter;
