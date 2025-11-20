import { pgTable, uuid, timestamp, unique } from "drizzle-orm/pg-core";
import { usersTable } from "./user.model.js";
import { commentsTable } from "./comments.model.js";

export const commentLikesTable = pgTable(
  "comment_likes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    commentId: uuid("comment_id")
      .notNull()
      .references(() => commentsTable.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique("unique_comment_like").on(table.commentId, table.userId), // prevents liking twice
  ]
);
