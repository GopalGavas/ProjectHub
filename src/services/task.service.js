import { db } from "../db/index.js";
import { projectMembersTable } from "../models/project-members.model.js";
import { projectsTable } from "../models/projects.model.js";
import { tasksTable } from "../models/tasks.model.js";
import { and, eq } from "drizzle-orm";

export const createTaskService = async (taskData) => {
  const [task] = await db.insert(tasksTable).values(taskData).returning();
  return task;
};

export const checkMemberService = async (projectId, userId) => {
  const [member] = await db
    .select({
      userId: projectMembersTable.userId,
    })
    .from(projectMembersTable)
    .where(
      and(
        eq(projectMembersTable.projectId, projectId),
        eq(projectMembersTable.userId, userId)
      )
    )
    .limit(1);

  return !!member;
};

export const updateTaskService = async (projectId, taskId, updatedData) => {
  const { title, description, priority, assignedTo, dueDate } = updatedData;
  const [updatedTask] = await db
    .update(tasksTable)
    .set({
      ...(title && { title }),
      ...(description && { description }),
      ...(priority && { priority }),
      ...(assignedTo && { assignedTo }),
      ...(dueDate && { dueDate }),
    })
    .where(and(eq(tasksTable.id, taskId), eq(tasksTable.projectId, projectId)))
    .returning();

  return updatedTask;
};
