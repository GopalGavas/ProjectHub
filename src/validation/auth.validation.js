import { z } from "zod";

export const registerUserValidation = z.object({
  name: z.string().trim().min(2, "Name must be atleasta 2 characters long"),
  email: z.email("Invalid email format").trim(),
  password: z.string().min(6, "Password must be atleast  6 characters long"),
  role: z.enum(["admin", "member", "guest"]).optional().default("member"),
});
