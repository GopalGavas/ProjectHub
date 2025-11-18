import { Router } from "express";
import {
  createCommentController,
  getCommentsByTaskController,
} from "../controllers/comment.controller.js";

const commentRouter = Router({ mergeParams: true });

commentRouter.post("/", createCommentController);
commentRouter.get("/", getCommentsByTaskController);

export default commentRouter;
