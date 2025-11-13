import { Router } from "express";
import {
  createTaskController,
  deleteTaskController,
  getTaskByIdController,
  restoreTaskController,
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
taskRouter.put("/:taskId/restore", restoreTaskController);
taskRouter.delete("/:taskId", deleteTaskController);

export default taskRouter;
