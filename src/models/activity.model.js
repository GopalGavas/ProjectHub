import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const activityTable = pgTable("activities", {
  id: uuid().primaryKey().defaultRandom(),

  projectId: uuid("project_id").notNull(),

  taskId: uuid("task_id").notNull(),

  commentId: uuid("comment_id").notNull(),

  actorId: uuid("actor_id").notNull(),

  action: text("action").notNull(),

  metadata: jsonb("metadata").default({}),

  createdAt: timestamp("created_at").defaultNow(),
});
