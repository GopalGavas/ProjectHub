import { Router } from "express";
import { createCommentController } from "../controllers/comment.controller.js";

const commentRouter = Router({ mergeParams: true });

commentRouter.post("/", createCommentController);

export default commentRouter;
