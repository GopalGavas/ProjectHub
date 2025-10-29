import { db } from "../db/index.js";
import { projectsTable } from "../models/projects.model.js";
import { projectMembersTable } from "../models/project-members.model.js";
import { usersTable } from "../models/user.model.js";
import { and, eq, inArray } from "drizzle-orm";

export const createProjectService = async (
  projectName,
  projectDescription,
  ownerId
) => {
  const [newProject] = await db
    .insert(projectsTable)
    .values({
      projectName,
      projectDescription,
      ownerId,
    })
    .returning();

  return newProject;
};

export const checkExistingUsersService = async (userIds) => {
  const users = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(and(inArray(usersTable.id, userIds), eq(usersTable.isActive, true)));

  return users;
};

export const addProjectMembersService = async (projectId, members) => {
  const formattedMembers = members.map((m) => ({
    projectId,
    userId: m.userId,
    role: m.role || "member",
  }));

  await db.insert(projectMembersTable).values(formattedMembers);
};
