import { Router } from "express";
import {
  createCommentController,
  getCommentsByTaskController,
  softDeleteCommentController,
  updateCommentController,
} from "../controllers/comment.controller.js";
import {
  addReactionToCommentController,
  getCommentReactionSummaryController,
  toggleCommentLikeController,
} from "../controllers/like.controller.js";

const commentRouter = Router({ mergeParams: true });

commentRouter.post("/", createCommentController);
commentRouter.get("/", getCommentsByTaskController);
commentRouter.put("/:commentId", updateCommentController);
commentRouter.put("/:commentId/delete", softDeleteCommentController);
commentRouter.post("/:commentId/like", toggleCommentLikeController);
commentRouter.post("/:commentId/reaction", addReactionToCommentController);
commentRouter.get("/:commentId/summary", getCommentReactionSummaryController);

export default commentRouter;
