import { desc, eq, count } from "drizzle-orm";
import { db } from "../db/index.js";
import { activityTable } from "../models/activity.model.js";

export const logActivity = async ({
  projectId,
  taskId = null,
  commentId = null,
  actorId,
  action,
  metadata = {},
}) => {
  await db.insert(activityTable).values({
    projectId,
    taskId,
    commentId,
    actorId,
    action,
    metadata,
  });
};

export const getActivitiesByProjectService = async (
  projectId,
  page = 1,
  limit = 10
) => {
  const offset = (page - 1) * limit;

  const [{ total }] = await db
    .select({ total: count() })
    .from(activityTable)
    .where(eq(activityTable.projectId, projectId));

  const projectActivities = await db
    .select()
    .from(activityTable)
    .where(eq(activityTable.projectId, projectId))
    .orderBy(desc(activityTable.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    count: projectActivities.length,
    projectActivities,
  };
};

export const getActivitiesByTaskService = async (
  taskId,
  page = 1,
  limit = 10
) => {
  const offset = (page - 1) * limit;

  const [{ total }] = await db
    .select({ total: count() })
    .from(activityTable)
    .where(eq(activityTable.taskId, taskId));

  const taskActivities = await db
    .select()
    .from(activityTable)
    .where(eq(activityTable.taskId, taskId))
    .orderBy(desc(activityTable.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    count: taskActivities.length,
    taskActivities,
  };
};

export const getActivitiesByUserService = async (userId, page, limit) => {
  const offset = (page - 1) * limit;

  const [{ total }] = await db
    .select({ total: count() })
    .from(activityTable)
    .where(eq(activityTable.taskId, taskId));

  const userActivities = await db
    .select()
    .from(activityTable)
    .where(eq(activityTable.actorId, userId))
    .orderBy(desc(activityTable.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    count: userActivities.length,
    userActivities,
  };
};
