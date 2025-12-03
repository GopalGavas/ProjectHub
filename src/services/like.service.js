import { commentLikesTable } from "../models/likes.model.js";
import { db } from "../db/index.js";
import { and, eq } from "drizzle-orm";
import { commentReactionsTable } from "../models/reactions.model.js";
import { deleteCache, deleteCachePatterns } from "../utils/cache.utils.js";

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

  await Promise.all([
    deleteCache(`comments:${commentId}`),
    deleteCache(`comments:${commentId}:summary`),
    deleteCachePatterns("comments:list:*"),
  ]);

  if (existingLike.length > 0) {
    await db
      .delete(commentLikesTable)
      .where(eq(commentLikesTable.id, existingLike[0].id));

    return { liked: false };
  } else {
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

export const addReactionToCommentService = async (commentId, userId, emoji) => {
  const existingReaction = await db
    .select()
    .from(commentReactionsTable)
    .where(
      and(
        eq(commentReactionsTable.commentId, commentId),
        eq(commentReactionsTable.userId, userId)
      )
    );

  await Promise.all([
    deleteCache(`comments:${commentId}`),
    deleteCache(`comments:${commentId}:summary`),
    deleteCachePatterns("comments:list:*"),
  ]);

  if (existingReaction.length === 0) {
    const [newReaction] = await db
      .insert(commentReactionsTable)
      .values({ commentId, userId, emoji })
      .returning();

    return { action: "added", reaction: newReaction };
  }

  if (existingReaction[0].emoji === emoji) {
    await db
      .delete(commentReactionsTable)
      .where(eq(commentReactionsTable.id, existingReaction[0].id));

    return { action: "removed" };
  }

  const [updatedReaction] = await db
    .update(commentReactionsTable)
    .set({ emoji })
    .where(eq(commentReactionsTable.id, existingReaction[0].id))
    .returning();
  return { action: "updated", reaction: updatedReaction };
};
