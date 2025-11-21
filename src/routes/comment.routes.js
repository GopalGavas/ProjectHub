import { Router } from "express";
import {
  createCommentController,
  getCommentsByTaskController,
  softDeleteCommentController,
  updateCommentController,
} from "../controllers/comment.controller.js";
import {
  addReactionToCommentController,
  toggleCommentLikeController,
} from "../controllers/like.controller.js";

const commentRouter = Router({ mergeParams: true });

commentRouter.post("/", createCommentController);
commentRouter.get("/", getCommentsByTaskController);
commentRouter.put("/:commentId", updateCommentController);
commentRouter.put("/:commentId/delete", softDeleteCommentController);
commentRouter.post("/:commentId/like", toggleCommentLikeController);
commentRouter.post("/:commentId/reaction", addReactionToCommentController);

export default commentRouter;
