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
