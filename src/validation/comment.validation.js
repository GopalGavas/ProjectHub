import { z } from "zod";

export const createCommentSchema = z.object({
  content: z.string().trim().min(1, "Content cannot be empty"),
  parentId: z.uuid("Invalid parent comment ID").optional().default(null),
});

export const updateCommentSchema = z.object({
  content: z.string().trim().min(1, "Content cannot be empty"),
});
