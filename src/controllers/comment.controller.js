import { successResponse } from "../utils/response.js";
import { errorResponse } from "../utils/error.js";
import {
  createCommentSchema,
  updateCommentSchema,
} from "../validation/comment.validation.js";
import { z } from "zod";
import {
  checkExistingTaskService,
  checkMemberService,
} from "../services/task.service.js";
import {
  checkExistingCommentService,
  createCommentService,
  getCommentsByTaskService,
  softDeleteCommentService,
  softDeleteCommentThreadService,
  updateCommentService,
} from "../services/comments.service.js";
import { buildCommentTree } from "../utils/commentTree.js";
import { validate as isUUID } from "uuid";

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
      .json(errorResponse("Internal Server Error", error.message));
  }
};

export const getCommentsByTaskController = async (req, res) => {
  try {
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

    const comments = await getCommentsByTaskService(taskId);

    const threadedComments = buildCommentTree(comments);

    return res.status(200).json(
      successResponse("Comments fetched successfully", {
        comments: threadedComments,
      })
    );
  } catch (error) {
    console.error("Error in getCommentsByTaskController:", error);
    return res
      .status(500)
      .json(errorResponse("Internal Server Error", error.message));
  }
};

export const updateCommentController = async (req, res) => {
  try {
    const validateData = await updateCommentSchema.safeParseAsync(req.body);
    if (!validateData.success) {
      const formattedErrors = z.treeifyError(validateData.error);
      return res
        .status(400)
        .json(errorResponse("Validation Error", formattedErrors));
    }
    const { content } = validateData.data;
    const { commentId } = req.params;

    const existingComment = await checkExistingCommentService(commentId);
    if (!existingComment) {
      return res
        .status(404)
        .json(
          errorResponse(
            "Comment not found",
            "Comment with given Id does not exists"
          )
        );
    }

    if (existingComment.authorId !== req.user.id) {
      return res
        .status(403)
        .json(errorResponse("Forbidden", "You are not the author of comment"));
    }

    const updatedComment = await updateCommentService(commentId, content);

    return res
      .status(200)
      .json(successResponse("Comment updated successfully", updatedComment));
  } catch (error) {
    console.error("Error in updateCommentController:", error);
    return res
      .status(500)
      .json(errorResponse("Internal Server Error", error.message));
  }
};

export const softDeleteCommentController = async (req, res) => {
  try {
    const { commentId } = req.params;

    if (!commentId || !isUUID(commentId)) {
      return res
        .status(400)
        .json(errorResponse("Validation Error", "Invalid commentId"));
    }

    const existingComment = await checkExistingCommentService(commentId);
    if (!existingComment) {
      return res
        .status(404)
        .json(
          errorResponse(
            "Comment not found",
            "Comment with given Id does not exists"
          )
        );
    }

    if (existingComment.authorId !== req.user.id) {
      return res
        .status(403)
        .json(errorResponse("Forbidden", "You are not the author of comment"));
    }

    if (existingComment.isDeleted) {
      return res
        .status(400)
        .json(errorResponse("Bad Request", "Comment is already deleted"));
    }

    let result;
    if (existingComment.parentId === null) {
      result = await softDeleteCommentThreadService(commentId);
    } else {
      result = await softDeleteCommentService(commentId);
    }

    return res
      .status(200)
      .json(successResponse("Comment deleted successfully", result));
  } catch (error) {
    console.error("Error in softDeleteCommentController:", error);
    return res
      .status(500)
      .json(errorResponse("Internal Server Error", error.message));
  }
};
