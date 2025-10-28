import { pgTable, uuid, pgEnum } from "drizzle-orm/pg-core";
import { projectsTable } from "./projects.model";
import { usersTable } from "./user.model";
import { timestamp } from "drizzle-orm/gel-core";

export const memberRoleEnum = pgEnum("role", ["owner", "manager", "member"]);

export const projectMembersTable = pgTable("project_members", {
  id: uuid().primaryKey().defaultRandom(),

  projectId: uuid("project_id").references(() => projectsTable.id, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),

  userId: uuid("user_id").references(() => usersTable.id, {
    onDelete: "set null",
    onUpdate: "cascade",
  }),

  role: memberRoleEnum("role").default("member").notNull(),

  joinedAt: timestamp("joined_at").defaultNow(),
});
