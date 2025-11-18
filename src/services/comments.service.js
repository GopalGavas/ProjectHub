import { commentsTable } from "../models/comments.model.js";
import { db } from "../db/index.js";
import { eq } from "drizzle-orm";

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
