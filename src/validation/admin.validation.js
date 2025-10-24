import { z } from "zod";

export const updateUserRoleValidation = z.object({
  role: z.enum(["admin", "member", "guest"], {
    errorMap: () => ({ message: "Role must be admin, member, or guest" }),
  }),
});
