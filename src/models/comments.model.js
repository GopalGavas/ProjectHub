import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "../models/user.model.js";
import { tasksTable } from "../models/tasks.model.js";

export const commentsTable = pgTable("comments", {
  id: uuid("id").defaultRandom().primaryKey(),

  content: text("content").notNull(),

  authorId: uuid("author_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),

  taskId: uuid("task_id")
    .notNull()
    .references(() => tasksTable.id, { onDelete: "cascade" }),

  parentId: uuid("parent_id")
    .references(() => commentsTable.id, { onDelete: "cascade" })
    .default(null),

  isDeleted: boolean("is_deleted").default(false).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
