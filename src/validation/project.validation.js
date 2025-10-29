import { z } from "zod";

export const createProjectValidation = z.object({
  projectName: z
    .string()
    .trim()
    .min(2, "Project Name must be atleast 2 characters long")
    .max(100, "Project name must be less than 100 characters"),

  projectDescription: z
    .string()
    .trim()
    .max(500, "Project description must be less than 500 characters")
    .optional(),

  members: z
    .array(
      z.object({
        userId: z.string(),
        role: z.enum(["owner", "manager", "member"]).default("member"),
      })
    )
    .optional()
    .default([]),
});
