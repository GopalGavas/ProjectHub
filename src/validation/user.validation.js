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
