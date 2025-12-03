import { commentsTable } from "../models/comments.model.js";
import { db } from "../db/index.js";
import { and, eq, inArray, sql } from "drizzle-orm";
import { usersTable } from "../models/user.model.js";
import { commentLikesTable } from "../models/likes.model.js";
import { commentReactionsTable } from "../models/reactions.model.js";
import {
  setCache,
  getCache,
  deleteCache,
  deleteCachePatterns,
} from "../utils/cache.utils.js";

export const createCommentService = async ({
  content,
  parentId = null,
  authorId,
  taskId,
}) => {
  const [comment] = await db
    .insert(commentsTable)
    .values({ content, parentId, authorId, taskId })
    .returning({
      id: commentsTable.id,
      value: commentsTable.content,
      parentId: commentsTable.parentId,
      authorId: commentsTable.authorId,
      taskId: commentsTable.taskId,
      createdAt: commentsTable.createdAt,
      updatedAt: commentsTable.updatedAt,
    });

  return comment;
};

export const checkExistingCommentService = async (commentId) => {
  const [comment] = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.id, commentId));

  return comment;
};

export const getCommentByIdService = async (commentId) => {
  const cachedKey = `comments:${commentId}`;
  const cached = await setCache(cachedKey);
  if (cached) return cached;

  const [comment] = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.id, commentId));

  await setCache(cachedKey);
  return comment;
};

export const getCommentsByTaskService = async (taskId) => {
  const cachedKey = `comments:comment:${taskId}`;
  const cached = await getCache(cachedKey);
  if (cached) return cached;

  const comments = await db
    .select({
      id: commentsTable.id,
      content: commentsTable.content,
      parentId: commentsTable.parentId,
      authorId: commentsTable.authorId,
      taskId: commentsTable.taskId,
      createdAt: commentsTable.createdAt,
      updatedAt: commentsTable.updatedAt,
      isDeleted: commentsTable.isDeleted,
      author: {
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
      },
    })
    .from(commentsTable)
    .leftJoin(usersTable, eq(commentsTable.authorId, usersTable.id))
    .where(
      and(eq(commentsTable.taskId, taskId), eq(commentsTable.isDeleted, false))
    );

  await setCache(cachedKey, comments, 90);

  return comments;
};

export const updateCommentService = async (commentId, content) => {
  const [updatedComment] = await db
    .update(commentsTable)
    .set({
      content,
    })
    .where(eq(commentsTable.id, commentId))
    .returning({
      id: commentsTable.id,
      content: commentsTable.content,
      parentId: commentsTable.parentId,
      authorId: commentsTable.authorId,
      createdAt: commentsTable.createdAt,
      updatedAt: commentsTable.updatedAt,
    });

  return updatedComment;
};

export const softDeleteCommentService = async (commentId) => {
  const [deletedComment] = await db
    .update(commentsTable)
    .set({
      isDeleted: true,
    })
    .where(eq(commentsTable.id, commentId))
    .returning({
      id: commentsTable.id,
      content: commentsTable.content,
      parentId: commentsTable.parentId,
      authorId: commentsTable.authorId,
      createdAt: commentsTable.createdAt,
      updatedAt: commentsTable.updatedAt,
      isDeleted: commentsTable.isDeleted,
    });

  return deletedComment;
};

export const softDeleteCommentThreadService = async (commentId) => {
  const allComments = await db.select().from(commentsTable);

  const map = new Map();

  allComments.forEach((comment) => {
    const parent = comment.parentId || "root";
    if (!map.has(parent)) map.set(parent, []);
    map.get(parent).push(comment);
  });

  const idsToDelete = [];

  const collectIds = (parentId) => {
    idsToDelete.push(parentId);
    const children = map.get(parentId) || [];
    if (children) {
      children.forEach((child) => collectIds(child.id));
    }
  };

  collectIds(commentId);

  await db
    .update(commentsTable)
    .set({
      isDeleted: true,
    })
    .where(inArray(commentsTable.id, idsToDelete));

  return { deletedId: idsToDelete };
};

export const getCommentReactionSummaryService = async (commentId, userId) => {
  const likeCount = await db
    .select({ count: sql`COUNT(*)` })
    .from(commentLikesTable)
    .where(eq(commentLikesTable.commentId, commentId))
    .then((r) => r[0]?.count || 0);

  const reactions = await db
    .select({
      emoji: commentReactionsTable.emoji,
      count: sql`COUNT(*)`,
      reactedByUser: sql`bool_or(${commentReactionsTable.userId} = ${userId})`,
    })
    .from(commentReactionsTable)
    .where(eq(commentReactionsTable.commentId, commentId))
    .groupBy(commentReactionsTable.emoji);

  return {
    likes: likeCount,
    reactions,
  };
};

export const hardDeleteCommentService = async (commentId) => {
  await db.delete(commentsTable).where(eq(commentsTable.id, commentId));
};

export const hardDeleteCommentThreadService = async (commentId) => {
  const allComments = await db.select().from(commentsTable);

  const map = new Map();

  allComments.forEach((comment) => {
    const parent = comment.parentId || "root";
    if (!map.has(parent)) map.set(parent, []);
    map.get(parent).push(comment);
  });

  const idsToDelete = [];

  const collectIds = (parentId) => {
    idsToDelete.push(parentId);
    const children = map.get(parentId) || [];
    if (children) {
      children.forEach((child) => collectIds(child.id));
    }
  };

  collectIds(commentId);

  await db.delete(commentsTable).where(inArray(commentsTable.id, idsToDelete));

  return { deletedId: idsToDelete };
};
