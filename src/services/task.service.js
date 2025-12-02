import { db } from "../db/index.js";
import { projectMembersTable } from "../models/project-members.model.js";
import { projectsTable } from "../models/projects.model.js";
import { tasksTable } from "../models/tasks.model.js";
import { and, eq, or, ilike, desc, asc, sql } from "drizzle-orm";
import { usersTable } from "../models/user.model.js";
import { validate as isUUID } from "uuid";
import {
  setCache,
  getCache,
  deleteCache,
  deleteCachePatterns,
} from "../utils/cache.utils.js";

export const createTaskService = async (taskData) => {
  const [task] = await db.insert(tasksTable).values(taskData).returning();

  await Promise.all([
    deleteCache(`tasks:task:${task.id}`),
    deleteCachePatterns(`tasks:list:${task.projectId}:*`),
  ]);

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

export const checkExistingTaskService = async (taskId) => {
  const [task] = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.id, taskId));

  return task;
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

  await Promise.all([
    deleteCache(`tasks:task:${taskId}`),
    deleteCachePatterns(`tasks:list:${projectId}:*`),
  ]);

  return updatedTask;
};

export const getTaskByIdService = async (taskId) => {
  const cachedKey = `tasks:task:${taskId}`;
  const cache = await getCache(cachedKey);
  if (cache) return cache;

  const [task] = await db
    .select({
      taskId: tasksTable.id,
      taskTitle: tasksTable.title,
      taskDescription: tasksTable.description,
      taskPriority: tasksTable.priority,
      taskStatus: tasksTable.status,
      dueDate: tasksTable.dueDate,
      assignedTo: tasksTable.assignedTo,
      assigneeName: usersTable.name,
      assigneeEmail: usersTable.email,
      projectName: projectsTable.projectName,
      projectDescription: projectsTable.projectDescription,
    })
    .from(tasksTable)
    .leftJoin(projectsTable, eq(projectsTable.id, tasksTable.projectId))
    .leftJoin(usersTable, eq(usersTable.id, tasksTable.assignedTo))
    .where(eq(tasksTable.id, taskId));

  if (task) setCache(`tasks:task:${taskId}`, task, 300);

  return task || null;
};

export const updateTaskStatusService = async (status, taskId) => {
  const [updatedTask] = await db
    .update(tasksTable)
    .set({
      status,
    })
    .where(eq(tasksTable.id, taskId))
    .returning({
      id: tasksTable.id,
      title: tasksTable.title,
      description: tasksTable.description,
      priority: tasksTable.priority,
      status: tasksTable.status,
      projectId: tasksTable.projectId,
    });

  await Promise.all([
    deleteCache(`tasks:task:${taskId}`),
    deleteCachePatterns(`tasks:list:${updatedTask.projectId}:*`),
  ]);

  return updatedTask;
};

export const softDeleteTaskService = async (taskId) => {
  const [task] = await db
    .update(tasksTable)
    .set({
      isDeleted: true,
    })
    .where(eq(tasksTable.id, taskId))
    .returning({
      id: tasksTable.id,
      title: tasksTable.title,
      description: tasksTable.description,
      isDeleted: tasksTable.isDeleted,
      projectId: tasksTable.projectId,
    });

  await Promise.all([
    deleteCache(`tasks:task:${taskId}`),
    deleteCachePatterns(`tasks:list:${task.projectId}:*`),
  ]);

  return task;
};

export const restoreTaskService = async (taskId) => {
  const [task] = await db
    .update(tasksTable)
    .set({
      isDeleted: false,
    })
    .where(eq(tasksTable.id, taskId))
    .returning({
      id: tasksTable.id,
      title: tasksTable.title,
      description: tasksTable.description,
      isDeleted: tasksTable.isDeleted,
      projectId: tasksTable.projectId,
    });

  await Promise.all([
    deleteCache(`tasks:task:${taskId}`),
    deleteCachePatterns(`tasks:list:${task.projectId}:*`),
  ]);

  return task;
};

export const deleteTaskService = async (taskId) => {
  const [task] = await db
    .select({ projectId: tasksTable.projectId })
    .from(tasksTable)
    .where(eq(tasksTable.id, taskId));

  if (!task) return null;

  await db.delete(tasksTable).where(eq(tasksTable.id, taskId));

  await Promise.all([
    deleteCache(`tasks:task:${taskId}`),
    deleteCachePatterns(`tasks:list:${task.projectId}:*`),
  ]);

  return task;
};

export const getAllTasksService = async (projectId, offset, limit, filters) => {
  const { status, priority, assignee, search, sortBy, order } = filters;

  const filtersKey = JSON.stringify({
    status,
    priority,
    assignee,
    search,
    sortBy,
    order,
  });
  const cachedKey = `tasks:list:${projectId}:${filtersKey}:${offset}:${limit}`;
  const cache = await getCache(cachedKey);
  if (cache) return cache;

  const conditions = [
    eq(tasksTable.projectId, projectId),
    eq(tasksTable.isDeleted, false),
  ];

  if (status) {
    conditions.push(eq(tasksTable.status, status));
  }

  if (priority) {
    conditions.push(eq(tasksTable.priority, priority));
  }

  if (assignee && isUUID(assignee))
    conditions.push(eq(tasksTable.assignedTo, assignee));

  if (search) {
    conditions.push(
      or(
        ilike(tasksTable.title, `%${search}%`),
        ilike(tasksTable.description, `%${search}%`)
      )
    );
  }

  const tasks = await db
    .select()
    .from(tasksTable)
    .where(and(...conditions))
    .orderBy(
      order === "asc" ? asc(tasksTable[sortBy]) : desc(tasksTable[sortBy])
    )
    .offset(offset)
    .limit(limit);

  const countTasks = await db
    .select({ count: sql`COUNT(*)` })
    .from(tasksTable)
    .where(and(...conditions));

  const totalCount = countTasks[0]?.count || 0;

  await setCache(cachedKey, { tasks, totalCount }, 120);

  return { tasks, totalCount };
};
