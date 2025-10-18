import { db } from "../db/index.js";
import { usersTable } from "../models/user.model.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const checkExistingUser = async (email) => {
  const formattedEmail = email.toLowerCase();
  const [existingUser] = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      password: usersTable.password,
      role: usersTable.role,
    })
    .from(usersTable)
    .where(eq(usersTable.email, formattedEmail));

  return existingUser;
};

export const registerUserService = async ({ name, email, password }) => {
  const formattedEmail = email.toLowerCase();
  const hashedPassword = await bcrypt.hash(password, 10);

  const [user] = await db
    .insert(usersTable)
    .values({
      name,
      email: formattedEmail,
      password: hashedPassword,
    })
    .returning({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
    });

  return user;
};
