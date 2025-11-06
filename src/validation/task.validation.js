import { z } from "zod";

export const createTaskValidation = z.object({
  title: z
    .string()
    .min(2, "title must be atleast 2 characters long")
    .max(155, "Title's length should not be greater than 155")
    .trim(),

  description: z
    .string()
    .min(2, "Description must be atleast 2 characters long")
    .max(250, "Description's length should not be greater than 155")
    .trim()
    .optional(),

  status: z
    .enum(["todo", "in-progress", "done"], {
      errorMap: () => ({ message: "Status must be todo, in-progress, done" }),
    })
    .default("todo"),

  priority: z
    .enum(["low", "medium", "high"], {
      errorMap: () => ({
        message: "Task priority must be one of 3 (low, medium or high)",
      }),
    })
    .default("medium"),

  assignedTo: z.uuid("Invalid uuid format").optional(),

  dueDate: z
    .string()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      "Due date must be a valid date or datetime string"
    )
    .transform((val) => (val ? new Date(val) : null))
    .optional(),
});
