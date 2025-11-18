import { successResponse } from "../utils/response.js";
import { errorResponse } from "../utils/error.js";
import { createCommentSchema } from "../validation/comment.validation.js";
import { z } from "zod";
import {
  checkExistingTaskService,
  checkMemberService,
} from "../services/task.service.js";
import {
  checkExistingCommentService,
  createCommentService,
} from "../services/comments.service.js";

export const createCommentController = async (req, res) => {
  try {
    const validateData = await createCommentSchema.safeParseAsync(req.body);

    if (!validateData.success) {
      const formattedErrors = z.treeifyError(validateData.error);
      return res
        .status(400)
        .json(errorResponse(400, "Validation Error", formattedErrors));
    }

    const { content, parentId = null } = validateData.data;
    const { projectId, taskId } = req.params;

    const task = await checkExistingTaskService(taskId);
    if (!task) {
      return res
        .status(404)
        .json(
          errorResponse("Task not found", "Task with given Id does not exists")
        );
    }

    const isMember = await checkMemberService(projectId, req.user.id);

    if (!isMember) {
      return res
        .status(403)
        .json(
          errorResponse("Forbidden", "You are not a member of this project")
        );
    }

    if (parentId) {
      const parentCommment = await checkExistingCommentService(parentId);

      if (!parentCommment) {
        return res
          .status(404)
          .json(
            errorResponse(
              "Parent Comment not found",
              "Parent Comment with given Id does not exists"
            )
          );
      }
    }

    const taskComment = await createCommentService({
      content,
      parentId,
      authorId: req.user.id,
      taskId,
    });

    return res
      .status(201)
      .json(successResponse("Comment Created Successfully", taskComment));
  } catch (error) {
    console.error("Error in createCommentController:", error);
    return res
      .status(500)
      .json(errorResponse(500, "Internal Server Error", error.message));
  }
};
