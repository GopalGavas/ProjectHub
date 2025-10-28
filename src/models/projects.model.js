import {
  uuid,
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import { usersTable } from "./user.model";

export const projectsTable = pgTable("projects", {
  id: uuid().primaryKey().defaultRandom(),

  projectName: varchar("project_name", { length: 150 }).notNull(),
  projectDescription: text("project_description"),

  ownerId: uuid("owner_id")
    .references(() => usersTable.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    })
    .notNull(),

  isActive: boolean("is_active").default(true).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
