import { z } from "zod";

export const registerUserValidation = z.object({
  name: z.string().trim().min(2, "Name must be atleast 2 characters long"),
  email: z.email("Invalid email format").trim(),
  password: z.string().min(6, "Password must be atleast  6 characters long"),
  role: z.enum(["admin", "member", "guest"]).optional().default("member"),
});

export const loginUserValidation = z.object({
  email: z.email("Invalid email format").trim(),
  password: z.string().min(6, "Password must be atleast 6 characters long"),
});

export const generateResetPassTokenValidation = z.object({
  email: z.email("Invalid Email address"),
});

export const resetPasswordValidation = z.object({
  newPassword: z.string().min(6, "Password must be of atleast 6 characters"),
});
