import { db } from "../db/index.js";
import { usersTable } from "../models/user.model.js";
import { and, eq, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const checkExistingUser = async (email) => {
  const formattedEmail = email.toLowerCase();
  const [existingUser] = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
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

export const comparePassword = async (password, userPassword) => {
  const isPasswordValid = await bcrypt.compare(password, userPassword);
  return isPasswordValid;
};

export const getUserById = async (userId) => {
  const [user] = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      password: usersTable.password,
    })
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  return user;
};

export const updateUserData = async (updatedData, userId) => {
  const [updatedUser] = await db
    .update(usersTable)
    .set(updatedData)
    .where(eq(usersTable.id, userId))
    .returning({
      name: usersTable.name,
      email: usersTable.email,
    });

  return updatedUser;
};

export const updateUserPassword = async (userId, newPassword) => {
  const hashNewPassword = await bcrypt.hash(newPassword, 10);
  const updatePassword = await db
    .update(usersTable)
    .set({
      password: hashNewPassword,
    })
    .where(eq(usersTable.id, userId));

  return updatePassword;
};

export const setResetPassToken = async (hashedToken, expiry, userId) => {
  await db
    .update(usersTable)
    .set({
      passwordResetToken: hashedToken,
      passwordResetExpires: new Date(expiry),
    })
    .where(eq(usersTable.id, userId));
};

export const findUserWithToken = async (token) => {
  const [user] = await db
    .select({
      id: usersTable.id,
      password: usersTable.password,
    })
    .from(usersTable)
    .where(
      and(
        eq(usersTable.passwordResetToken, token),
        gt(usersTable.passwordResetExpires, new Date())
      )
    );

  return user;
};

export const updatePasswordAndResetToken = async (userId, newHashPassword) => {
  const updatePassword = await db
    .update(usersTable)
    .set({
      password: newHashPassword,
      passwordResetToke: null,
      passwordResetExpires: null,
    })
    .where(eq(usersTable.id, userId));

  return updatePassword;
};
