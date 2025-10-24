import { z } from "zod";

export const validateUserDetails = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be atleast 2 characters long")
      .optional(),
    email: z.email("Invalid Email Format").trim().optional(),
  })
  .refine(
    (data) => data.name || data.email,
    "Atleast one field (name or email) must be provided for update"
  );

export const changePasswordValidation = z.object({
  oldPassword: z.string().min(6, "Password must be atleast of 6 characters"),
  newPassword: z.string().min(6, "Password must be atleast of 6 characters"),
});
