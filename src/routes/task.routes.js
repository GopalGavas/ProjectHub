import { Router } from "express";
import { createTaskController } from "../controllers/task.controller.js";

const taskRouter = Router({ mergeParams: true });

taskRouter.post("/", createTaskController);

export default taskRouter;
