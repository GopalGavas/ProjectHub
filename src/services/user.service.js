import { db } from "../db/index.js";
import { usersTable } from "../models/user.model.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const chechExistingUser = async (email) => {
  const [existingUser] = await db
    .select({
      email: usersTable.email,
    })
    .from(usersTable)
    .where(eq(usersTable.email, email));

  return existingUser;
};

export const registerUserService = async ({ name, email, password }) => {
  const formattedEmail = email.toLowerCase();
  const hashedPassword = bcrypt.hash(password, 10);

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
