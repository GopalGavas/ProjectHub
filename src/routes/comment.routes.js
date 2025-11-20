import { Router } from "express";
import {
  createCommentController,
  getCommentsByTaskController,
  softDeleteCommentController,
  updateCommentController,
} from "../controllers/comment.controller.js";

const commentRouter = Router({ mergeParams: true });

commentRouter.post("/", createCommentController);
commentRouter.get("/", getCommentsByTaskController);
commentRouter.put("/:commentId", updateCommentController);
commentRouter.put("/:commentId/delete", softDeleteCommentController);

export default commentRouter;
