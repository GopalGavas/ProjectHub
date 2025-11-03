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

export const updateProjectValidation = z
  .object({
    projectName: z
      .string()
      .trim()
      .min(2, "Project Name must be atleast 2 characters long")
      .max(100, "Project name must be less than 100 characters")
      .optional(),

    projectDescription: z
      .string()
      .trim()
      .max(500, "Project description must be less than 500 characters")
      .optional(),
  })
  .refine(
    (data) => data.projectName || data.projectDescription,
    "Atleast one field (projectName or projectDescription) must be provided for update"
  );

export const addMemberToProjectValidation = z.object({
  members: z
    .array(
      z.object({
        userId: z.string(),
        role: z.enum(["owner", "manager", "member"]).default("member"),
      })
    )
    .refine((arr) => arr.length > 0, {
      message: "At least one member must be provided",
    }),
});

export const removeMemberFromProjectValidation = z.object({
  members: z.array(z.string()).min(1, "Atleast one memberId must be provided"),
});
