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

export const getProjectByIdService = async (projectId) => {
  const rows = await db
    .select({
      projectId: projectsTable.id,
      projectName: projectsTable.projectName,
      projectDescription: projectsTable.projectDescription,
      ownerId: projectsTable.ownerId,
      isActive: projectsTable.isActive,
      createdAt: projectsTable.createdAt,
      memberId: projectMembersTable.userId,
      memberRole: projectMembersTable.role,
      memberJoinedAt: projectMembersTable.joinedAt,
      memberName: usersTable.name,
      memberEmail: usersTable.email,
    })
    .from(projectsTable)
    .leftJoin(
      projectMembersTable,
      eq(projectsTable.id, projectMembersTable.projectId)
    )
    .leftJoin(usersTable, eq(usersTable.id, projectMembersTable.userId))
    .where(eq(projectsTable.id, projectId));

  if (!rows.length) return null;

  const project = {
    id: rows[0].projectId,
    projectName: rows[0].projectName,
    projectDescription: rows[0].projectDescription,
    ownerId: rows[0].ownerId,
    isActive: rows[0].isActive,
    createdAt: rows[0].createdAt,
    members: rows
      .filter((r) => r.memberId)
      .map((r) => ({
        id: r.memberId,
        name: r.memberName,
        email: r.memberEmail,
        role: r.memberRole,
        joinedAt: r.memberJoinedAt,
      })),
  };

  return project;
};
