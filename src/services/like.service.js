import { commentLikesTable } from "../models/likes.model.js";
import { db } from "../db/index.js";
import { and, eq } from "drizzle-orm";

export const toggleCommentLikeService = async (commentId, userId) => {
  const existingLike = await db
    .select()
    .from(commentLikesTable)
    .where(
      and(
        eq(commentLikesTable.commentId, commentId),
        eq(commentLikesTable.userId, userId)
      )
    );

  if (existingLike.length > 0) {
    await db
      .delete(commentLikesTable)
      .where(eq(commentLikesTable.id, existingLike[0].id));

    return { liked: false };
  } else {
    // Like the comment
    const [likedComment] = await db
      .insert(commentLikesTable)
      .values({
        commentId,
        userId,
      })
      .returning();

    return { liked: true, likedComment };
  }
};
