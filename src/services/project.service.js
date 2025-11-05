import { db } from "../db/index.js";
import { projectsTable } from "../models/projects.model.js";
import { projectMembersTable } from "../models/project-members.model.js";
import { usersTable } from "../models/user.model.js";
import { and, eq, ilike, inArray, sql, or } from "drizzle-orm";

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

export const addProjectMembersService = async (projectId, members, tx = db) => {
  const formattedMembers = members.map((m) => ({
    projectId,
    userId: m.userId,
    role: m.role || "member",
  }));

  const inserted = await tx
    .insert(projectMembersTable)
    .values(formattedMembers)
    .returning({
      userId: projectMembersTable.userId,
      role: projectMembersTable.role,
      projectId: projectMembersTable.projectId,
    });

  return inserted;
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

export const getAllProjectsService = async ({
  offset = 0,
  limit = 10,
  search = "",
}) => {
  let whereClause = eq(projectsTable.isActive, true);

  if (search) {
    whereClause = and(
      eq(projectsTable.isActive, true),
      or(
        ilike(projectsTable.projectName, `%${search}%`),
        ilike(projectsTable.projectDescription, `%${search}%`)
      )
    );
  }

  const projects = await db
    .select({
      projectId: projectsTable.id,
      projectName: projectsTable.projectName,
      projectDescription: projectsTable.projectDescription,
      ownerId: projectsTable.ownerId,
      isActive: projectsTable.isActive,
      createdAt: projectsTable.createdAt,
    })
    .from(projectsTable)
    .where(whereClause)
    .offset(offset)
    .limit(limit);

  if (projects === 0) {
    return { projects: [], totalCount: 0 };
  }

  const projectIds = projects.map((p) => p.projectId);

  const memberRows = await db
    .select({
      projectId: projectMembersTable.projectId,
      userId: projectMembersTable.userId,
      role: projectMembersTable.role,
      joinedAt: projectMembersTable.joinedAt,
      name: usersTable.name,
      email: usersTable.email,
    })
    .from(projectMembersTable)
    .leftJoin(usersTable, eq(usersTable.id, projectMembersTable.userId))
    .where(inArray(projectMembersTable.projectId, projectIds));

  const membersByProject = {};
  for (const m of memberRows) {
    if (!membersByProject[m.projectId]) membersByProject[m.projectId] = [];
    membersByProject[m.projectId].push({
      id: m.userId,
      name: m.name,
      email: m.email,
      role: m.role,
      joinedAt: m.joinedAt,
    });
  }

  const projectWithMembers = projects.map((p) => ({
    ...p,
    members: membersByProject[p.projectId] || [],
  }));

  const totalCountResult = await db
    .select({ count: sql`COUNT(*)` })
    .from(projectsTable)
    .where(whereClause);

  const totalCount = parseInt(totalCountResult[0].count, 10);

  return { projectWithMembers, totalCount };
};

export const checkExistingProjectService = async (projectId) => {
  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, projectId));

  return project;
};

export const updateProjectService = async (
  projectId,
  projectName,
  projectDescription
) => {
  const [updatedProject] = await db
    .update(projectsTable)
    .set({
      ...(projectName && { projectName }),
      ...(projectDescription && { projectDescription }),
      updatedAt: new Date(),
    })
    .where(eq(projectsTable.id, projectId))
    .returning();

  return updatedProject;
};

export const roleBasedUpdateProjectService = async (projectId, userId) => {
  const [project] = await db
    .select({
      ownerId: projectsTable.ownerId,
    })
    .from(projectsTable)
    .where(eq(projectsTable.id, projectId))
    .limit(1);

  const [manager] = await db
    .select({
      userId: projectMembersTable.userId,
    })
    .from(projectMembersTable)
    .where(
      and(
        eq(projectMembersTable.projectId, projectId),
        eq(projectMembersTable.userId, userId),
        eq(projectMembersTable.role, "manager")
      )
    )
    .limit(1);

  return {
    isOwner: project?.ownerId === userId,
    isManager: !!manager,
  };
};

export const checkAddedMembersService = async (projectId, userIds) => {
  const existingMembers = await db
    .select({ userId: projectMembersTable.userId })
    .from(projectMembersTable)
    .where(
      and(
        eq(projectMembersTable.projectId, projectId),
        inArray(projectMembersTable.userId, userIds)
      )
    );

  return existingMembers;
};

export const removeProjectMemberService = async (
  projectId,
  membersId,
  tx = db
) => {
  return await tx
    .delete(projectMembersTable)
    .where(
      and(
        eq(projectMembersTable.projectId, projectId),
        inArray(projectMembersTable.userId, membersId)
      )
    );
};

export const userDetailsService = async (userIds) => {
  const userDetails = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
    })
    .from(usersTable)
    .where(inArray(usersTable.id, userIds));

  return userDetails;
};

export const deactivateProjectService = async (projectId) => {
  const [deactivatedProject] = await db
    .update(projectsTable)
    .set({
      isActive: false,
    })
    .where(eq(projectsTable.id, projectId))
    .returning({
      id: projectsTable.id,
      name: projectsTable.projectName,
      isActive: projectsTable.isActive,
    });

  return deactivatedProject;
};

export const restoreProjectService = async (projectId) => {
  const [restoredProject] = await db
    .update(projectsTable)
    .set({
      isActive: true,
    })
    .where(eq(projectsTable.id, projectId))
    .returning({
      id: projectsTable.id,
      name: projectsTable.projectName,
      isActive: projectsTable.isActive,
    });

  return restoredProject;
};

export const deleteProjectService = async (projectId) => {
  await db.delete(projectsTable).where(eq(projectsTable.id, projectId));
};
