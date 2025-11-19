import { commentsTable } from "../models/comments.model.js";
import { db } from "../db/index.js";
import { eq } from "drizzle-orm";
import { usersTable } from "../models/user.model.js";

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

export const getCommentsByTaskService = async (taskId) => {
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
    .where(eq(commentsTable.taskId, taskId));

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
