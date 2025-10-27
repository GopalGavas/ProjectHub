import {
  uuid,
  pgTable,
  varchar,
  text,
  timestamp,
  boolean,
  pgEnum,
  integer,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("role", ["admin", "member", "guest"]);

export const usersTable = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 155 }).unique().notNull(),
  password: text().notNull(),
  role: userRoleEnum("role").default("member").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  tokenVersion: integer("token_version").default(0).notNull(),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
});
