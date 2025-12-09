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
import { logActivity } from "../services/activity.service.js";
import { validateProjectAndComment } from "../utils/project.utils.js";

export const toggleCommentLikeController = async (req, res) => {
  try {
    const { commentId, taskId, projectId } = req.params;

    const { comment } = await validateProjectAndComment(
      projectId,
      commentId,
      req.user.id
    );
    const result = await toggleCommentLikeService(commentId, req.user.id);

    await logActivity({
      projectId,
      taskId,
      commentId,
      actorId: req.user.id,
      action: result.liked ? "liked_comment" : "unliked_comment",
      metadata: {
        liked: result.liked,
        comment: comment.content,
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

    const { comment } = await validateProjectAndComment(
      projectId,
      commentId,
      req.user.id
    );

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
        comment: comment.content,
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
    return res.status(500).json(errorResponse("Internal server error"));
  }
};

export const getCommentReactionSummaryController = async (req, res) => {
  try {
    const { projectId, commentId } = req.params;

    await validateProjectAndComment(projectId, commentId, req.user.id);

    const result = await getCommentReactionSummaryService(
      commentId,
      req.user.id
    );

    return res
      .status(200)
      .json(successResponse("Comment Summary fetched successfully", result));
  } catch (error) {
    return res.status(500).json(errorResponse("Internal Server Error"));
  }
};
