import { successResponse } from "../utils/response.js";
import { errorResponse } from "../utils/error.js";
import { validate as isUUID } from "uuid";
import { checkExistingCommentService } from "../services/comments.service.js";
import {
  addReactionToCommentService,
  toggleCommentLikeService,
} from "../services/like.service.js";
import { addReactionSchema } from "../validation/comment.validation.js";
import { z } from "zod";
import { checkExistingProjectService } from "../services/project.service.js";
import { checkMemberService } from "../services/task.service.js";

export const toggleCommentLikeController = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { projectId } = req.params;

    if (!isUUID(projectId) || !isUUID(commentId)) {
      return res
        .status(400)
        .json(
          errorResponse(
            `Invalid ${!isUUID(projectId) ? "Project" : "Comment"} Id`,
            `Enter a valid ${!isUUID(projectId) ? "Project" : "Comment"} Id`
          )
        );
    }

    const project = await checkExistingProjectService(projectId);
    if (!project) {
      return res
        .status(404)
        .json(
          errorResponse(
            "Project not found",
            "Project with provided Id does not exists"
          )
        );
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

    const isMember = await checkMemberService(projectId, req.user.id);

    if (!isMember) {
      return res
        .status(403)
        .json(
          errorResponse(
            "Forbidden Request",
            "Only project members can like this comment."
          )
        );
    }

    const result = await toggleCommentLikeService(commentId, req.user.id);

    return res
      .status(200)
      .json(
        successResponse(
          result.liked
            ? "Comment liked successfully"
            : "Comment unliked successfully",
          result
        )
      );
  } catch (error) {
    console.error("Error toggling comment like:", error);
    return res.status(500).json(errorResponse("Internal server error"));
  }
};

export const addReactionToCommentController = async (req, res) => {
  try {
    const validateData = await addReactionSchema.safeParseAsync(req.body);
    if (!validateData.success) {
      const formattedError = z.treeifyError(validateData.error);
      return res
        .status(400)
        .json(errorResponse("Invalid request", formattedError));
    }
    const { emoji } = validateData.data;
    const { commentId, projectId } = req.params;

    if (!isUUID(projectId) || !isUUID(commentId)) {
      return res
        .status(400)
        .json(
          errorResponse(
            `Invalid ${!isUUID(projectId) ? "Project" : "Comment"} ID`,
            `The provided ${
              !isUUID(projectId) ? "Project" : "Comment"
            } ID is not valid.`
          )
        );
    }

    const project = await checkExistingProjectService(projectId);
    if (!project) {
      return res
        .status(404)
        .json(
          errorResponse(
            "Project not found",
            "Project with provided Id does not exists"
          )
        );
    }

    const isMember = await checkMemberService(projectId, req.user.id);
    if (!isMember) {
      return res
        .status(403)
        .json(
          errorResponse(
            "Forbidden",
            "Only Project Members can react on Comments"
          )
        );
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

    const result = await addReactionToCommentService(
      commentId,
      req.user.id,
      emoji
    );

    return res
      .status(200)
      .json(
        successResponse(
          `Reaction ${result.action} successfully`,
          result.reaction || null
        )
      );
  } catch (error) {
    console.error("Error adding reaction controller to comment:", error);
    return res.status(500).json(errorResponse("Internal server error"));
  }
};
