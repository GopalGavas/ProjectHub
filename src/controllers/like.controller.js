import { successResponse } from "../utils/response.js";
import { errorResponse } from "../utils/error.js";
import { validate as isUUID } from "uuid";
import {
  checkExistingCommentService,
  getCommentReactionSummaryService,
} from "../services/comments.service.js";
import {
  addReactionToCommentService,
  toggleCommentLikeService,
} from "../services/like.service.js";
import { addReactionSchema } from "../validation/comment.validation.js";
import { z } from "zod";
import { checkExistingProjectService } from "../services/project.service.js";
import { checkMemberService } from "../services/task.service.js";
import { logActivity } from "../services/activity.service.js";

export const toggleCommentLikeController = async (req, res) => {
  try {
    const { commentId, taskId, projectId } = req.params;

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

    await logActivity({
      projectId,
      taskId,
      commentId,
      actorId: req.user.id,
      action: result.liked ? "liked_comment" : "unliked_comment",
      metadata: {
        liked: result.liked,
        comment: existingComment.content,
      },
    });

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
    const { commentId, taskId, projectId } = req.params;

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

    let action;

    switch (result.action) {
      case "added":
        action = "added_reaction_to_comment";
        break;
      case "updated":
        action = "updated_reaction_on_comment";
        break;
      case "removed":
        action = "removed_reaction_from_comment";
        break;
      default:
        action = "reacted_to_comment";
        break;
    }

    await logActivity({
      projectId,
      taskId,
      commentId,
      actorId: req.user.id,
      action,
      metadata: {
        emoji,
        comment: existingComment.content,
      },
    });

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

export const getCommentReactionSummaryController = async (req, res) => {
  try {
    const { projectId, commentId } = req.params;

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
            "Only Project Members can perform this action"
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

    const result = await getCommentReactionSummaryService(
      commentId,
      req.user.id
    );

    return res
      .status(200)
      .json(successResponse("Comment Summary fetched successfully", result));
  } catch (error) {
    console.error("Error in Get Comment Reaction Controller", error);
    return res.status(500).json(errorResponse("Internal Server Error"));
  }
};
