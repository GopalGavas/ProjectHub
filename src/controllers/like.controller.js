import { successResponse } from "../utils/response.js";
import { errorResponse } from "../utils/error.js";
import { validate as isUUID } from "uuid";
import { checkExistingCommentService } from "../services/comments.service.js";
import { toggleCommentLikeService } from "../services/like.service.js";

export const toggleCommentLikeController = async (req, res) => {
  try {
    const { commentId } = req.params;

    if (!commentId || !isUUID(commentId)) {
      return res
        .status(400)
        .json(
          errorResponse(
            "Invalid comment ID",
            "The provided comment ID is not valid."
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
