import { Router } from "express";
import {
  createTaskController,
  getTaskByIdController,
  updateTaskController,
} from "../controllers/task.controller.js";

const taskRouter = Router({ mergeParams: true });

taskRouter.post("/", createTaskController);
taskRouter.get("/:taskId", getTaskByIdController);
taskRouter.put("/:taskId", updateTaskController);

export default taskRouter;
