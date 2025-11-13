import {
  uuid,
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { projectsTable } from "./projects.model.js";
import { usersTable } from "./user.model.js";

export const taskStatusEnum = pgEnum("task_status", [
  "todo",
  "in-progress",
  "done",
]);

export const taskPriorityEnum = pgEnum("task_priority", [
  "low",
  "medium",
  "high",
]);

export const tasksTable = pgTable(
  "tasks",
  {
    id: uuid().defaultRandom().primaryKey(),
    projectId: uuid("project_id").references(() => projectsTable.id, {
      onDelete: "cascade",
    }),
    title: varchar("title", { length: 155 }).notNull(),
    description: text("description"),
    status: taskStatusEnum("status").default("todo").notNull(),
    priority: taskPriorityEnum("priority").default("medium").notNull(),
    assignedTo: uuid("assigned_to").references(() => usersTable.id),
    dueDate: timestamp("due_date"),
    isDeleted: boolean("is_deleted").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    projectIdx: index("idx_task_project").on(table.projectId),
    assignedIdx: index("idx_task_assigned_to").on(table.assignedTo),
    statusIdx: index("idx_task_status").on(table.status),
  })
);
