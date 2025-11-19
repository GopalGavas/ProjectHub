import { Router } from "express";
import {
  createCommentController,
  getCommentsByTaskController,
  updateCommentController,
} from "../controllers/comment.controller.js";

const commentRouter = Router({ mergeParams: true });

commentRouter.post("/", createCommentController);
commentRouter.get("/", getCommentsByTaskController);
commentRouter.put("/:commentId", updateCommentController);

export default commentRouter;
