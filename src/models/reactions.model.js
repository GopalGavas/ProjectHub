import { pgTable, uuid, timestamp, text } from "drizzle-orm/pg-core";
import { usersTable } from "./user.model.js";
import { commentsTable } from "./comments.model.js";

export const commentReactionsTable = pgTable("comment_reactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  commentId: uuid("comment_id")
    .notNull()
    .references(() => commentsTable.id),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id),
  emoji: text("emoji").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});
