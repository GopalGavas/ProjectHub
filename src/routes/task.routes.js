import { Router } from "express";
import {
  createTaskController,
  deleteTaskController,
  getAllTasksController,
  getTaskByIdController,
  restoreTaskController,
  softDeleteTaskController,
  updateTaskController,
  updateTaskStatusController,
} from "../controllers/task.controller.js";
import commentRouter from "./comment.routes.js";
import { getActivitiesByTaskController } from "../controllers/activity.controller.js";

const taskRouter = Router({ mergeParams: true });

taskRouter.post("/", createTaskController);
taskRouter.get("/", getAllTasksController);
taskRouter.get("/:taskId", getTaskByIdController);
taskRouter.put("/:taskId", updateTaskController);
taskRouter.put("/:taskId/status", updateTaskStatusController);
taskRouter.put("/:taskId/delete", softDeleteTaskController);
taskRouter.put("/:taskId/restore", restoreTaskController);
taskRouter.get("/:taskId/activities", getActivitiesByTaskController);
taskRouter.delete("/:taskId", deleteTaskController);

taskRouter.use("/:taskId/comments", commentRouter);

export default taskRouter;
