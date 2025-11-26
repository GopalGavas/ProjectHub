import { successResponse } from "../utils/response.js";
import { errorResponse } from "../utils/error.js";
import {
  addMemberToProjectValidation,
  createProjectValidation,
  removeMemberFromProjectValidation,
  updateProjectValidation,
} from "../validation/project.validation.js";
import { z } from "zod";
import {
  addProjectMembersService,
  checkAddedMembersService,
  checkExistingProjectService,
  checkExistingUsersService,
  createProjectService,
  deactivateProjectService,
  getAllProjectsService,
  getProjectByIdService,
  removeProjectMemberService,
  roleBasedUpdateProjectService,
  updateProjectService,
  userDetailsService,
  restoreProjectService,
  deleteProjectService,
} from "../services/project.service.js";
import { validate as isUUID } from "uuid";
import { db } from "../db/index.js";
import { checkProjectIsActive } from "../utils/project.utils.js";
import { logActivity } from "../services/activity.service.js";

export const createProjectController = async (req, res) => {
  try {
    const validateData = await createProjectValidation.safeParseAsync(req.body);

    if (!validateData.success) {
      const formattedError = z.treeifyError(validateData.error);
      return res
        .status(400)
        .json(errorResponse("Invalid Request", formattedError));
    }

    const { projectName, projectDescription, members } = validateData.data;
    const ownerId = req.user.id;

    if (members && members.length > 0) {
      const invalidIds = members.filter((m) => !isUUID(m.userId));
      if (invalidIds.length > 0) {
        return res
          .status(400)
          .json(errorResponse("Invalid userId(s) in the members list"));
      }
    }

    const allMembers = [{ userId: ownerId, role: "owner" }, ...(members || [])];
    const allUserIds = allMembers?.map((m) => m.userId) || [];

    if (allUserIds.length > 0) {
      const existingUsers = await checkExistingUsersService(allUserIds);
      if (existingUsers.length !== allUserIds.length) {
        return res
          .status(400)
          .json(
            errorResponse(
              "One or more provided users do not exist or is deactivated User"
            )
          );
      }
    }

    const project = await db.transaction(async (tx) => {
      const newProject = await createProjectService(
        projectName,
        projectDescription,
        ownerId,
        tx
      );

      await addProjectMembersService(newProject.id, allMembers, tx);
      return newProject;
    });

    // "ACTIVITY LOG"
    await logActivity({
      projectId: project.id,
      actorId: ownerId,
      action: "project_created",
      metadata: {
        name: projectName,
        description: projectDescription,
      },
    });

    for (const member of allMembers) {
      if (member.userId === ownerId) continue;

      await logActivity({
        projectId: project.id,
        actorId: ownerId,
        action: "members_added_to_project",
        metadata: {
          projectName: projectName,
          memberId: member.userId,
          memberRole: member.role,
        },
      });
    }

    return res.status(201).json(
      successResponse("Project created Successfully", {
        id: project.id,
        name: project.projectName,
        description: project.projectDescription,
        ownerId: project.ownerId,
        isActive: project.isActive,
        createdAt: project.createdAt,
        members: {
          allMembers,
        },
      })
    );
  } catch (error) {
    console.error("Error in Create Project Controller: ", error);
    return res.status(500).json(errorResponse("Internal Server Error"));
  }
};

export const getProjectByIdController = async (req, res) => {
  try {
    const projectId = req.params.id;

    if (!projectId || !isUUID(projectId)) {
      return res
        .status(400)
        .json(errorResponse("Invalid Request", "Please provide a valid UUID"));
    }

    const project = await getProjectByIdService(projectId);

    if (!project) {
      return res
        .status(404)
        .json(
          errorResponse(
            "Project not found",
            "Project with this Id do not exists"
          )
        );
    }

    return res.status(200).json(
      successResponse("Project fetched successfully", {
        project,
      })
    );
  } catch (error) {
    console.error("Error in Get Project By Id Controller: ", error);
    return res.status(500).json(errorResponse("Internal Server Error"));
  }
};

export const getAllProjectsController = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const { projectWithMembers, totalCount } = await getAllProjectsService({
      offset,
      limit: limitNum,
      search,
    });

    return res.status(200).json(
      successResponse("All Projects fetched Successfully", {
        data: projectWithMembers,
        pagination: {
          total: totalCount,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalCount / limitNum),
        },
      })
    );
  } catch (error) {
    console.error("Error in Get All Projects Controller: ", error);
    return res.status(500).json(errorResponse("Internal Server Error"));
  }
};

export const updateProjectController = async (req, res) => {
  try {
    const validateData = await updateProjectValidation.safeParseAsync(req.body);
    if (!validateData.success) {
      const formattedError = z.treeifyError(validateData.error);
      return res
        .status(400)
        .json(errorResponse("Invalid Request", formattedError));
    }

    const { projectName, projectDescription } = validateData.data;
    const projectId = req.params.id;

    const existing = await checkExistingProjectService(projectId);

    if (!existing) {
      return res
        .status(404)
        .json(
          errorResponse(
            "Project Not found",
            "Project with provided id does not exists"
          )
        );
    }

    const ensureActive = checkProjectIsActive(existing, "update details");
    if (ensureActive) {
      return res.status(ensureActive.status).json(ensureActive.response);
    }

    const { isOwner, isManager } = await roleBasedUpdateProjectService(
      projectId,
      req.user?.id
    );

    if (!isOwner && !isManager) {
      return res
        .status(403)
        .json(
          errorResponse(
            "Forbidden",
            "Only the project owner or manager can update this project"
          )
        );
    }

    const updatedProject = await updateProjectService(
      projectId,
      projectName,
      projectDescription
    );

    const changes = {};

    // Check if project name changed
    if (projectName && projectName !== existing.projectName) {
      changes.projectName = {
        old: existing.projectName,
        new: updatedProject.projectName,
      };
    }

    // Check if project description changed
    if (
      projectDescription &&
      projectDescription !== existing.projectDescription
    ) {
      changes.projectDescription = {
        old: existing.projectDescription,
        new: updatedProject.projectDescription,
      };
    }

    // Only log if at least one field changed
    if (Object.keys(changes).length > 0) {
      await logActivity({
        projectId,
        actorId: req.user.id,
        action: "project_details_updated",
        metadata: { changes },
      });
    }

    return res
      .status(200)
      .json(successResponse("Project Updated Successfully", updatedProject));
  } catch (error) {
    console.error("Error in Update Project Controller: ", error);
    return res.status(500).json(errorResponse("Internal Server Error"));
  }
};

export const addMembersToProjectController = async (req, res) => {
  try {
    const validateData = await addMemberToProjectValidation.safeParseAsync(
      req.body
    );

    if (!validateData.success) {
      const formattedError = z.treeifyError(validateData.error);
      return res
        .status(400)
        .json(errorResponse("Invalid Request", formattedError));
    }

    const { members } = validateData.data;
    const projectId = req.params.id;

    const invalidIds = members.filter((m) => !isUUID(m.userId));
    if (invalidIds.length > 0) {
      return res
        .status(400)
        .json(errorResponse("Invalid userId(s) in the members list"));
    }

    const existingProject = await checkExistingProjectService(projectId);
    if (!existingProject) {
      return res
        .status(404)
        .json(
          errorResponse(
            "Project not found",
            "Project with provided Id does not exists"
          )
        );
    }

    const ensureActive = checkProjectIsActive(existingProject, "add members");
    if (ensureActive) {
      return res.status(ensureActive.status).json(ensureActive.response);
    }

    const { isOwner, isManager } = await roleBasedUpdateProjectService(
      projectId,
      req.user.id
    );

    if (!isOwner && !isManager) {
      return res
        .status(403)
        .json(
          errorResponse(
            "Forbidden",
            "Only the project owner or manager can add members to this project"
          )
        );
    }

    const userIds = members.map((m) => m.userId);
    const existingUsers = await checkExistingUsersService(userIds);
    const existingUsersIds = existingUsers.map((m) => m.id);
    const missingIds = userIds.filter((id) => !existingUsersIds.includes(id));
    if (missingIds.length > 0) {
      return res
        .status(400)
        .json(errorResponse("Some provided users do not exist", missingIds));
    }

    const existingMembers = await checkAddedMembersService(projectId, userIds);

    if (existingMembers.length > 0) {
      const existingIds = existingMembers.map((m) => m.userId);
      return res
        .status(400)
        .json(
          errorResponse("Some users are already project members", existingIds)
        );
    }

    const addedMembers = await db.transaction(async (tx) => {
      return await addProjectMembersService(projectId, members, tx);
    });

    for (const member of addedMembers) {
      await logActivity({
        projectId,
        actorId: existingProject.ownerId,
        action: "members_added_to_project",
        metadata: {
          projectName: existingProject.projectName,
          memberId: member.userId,
          memberRole: member.role,
        },
      });
    }

    return res.status(201).json(
      successResponse("New members added successfully", {
        count: addedMembers.length || 0,
        addedMembers: addedMembers || [],
      })
    );
  } catch (error) {
    console.error("Error in Add-Members-To-Project Controller: ", error);
    return res.status(500).json(errorResponse("Internal Server Error"));
  }
};

export const removeMembersFromProjectController = async (req, res) => {
  try {
    const validateData = await removeMemberFromProjectValidation.safeParseAsync(
      req.body
    );
    if (!validateData.success) {
      const formattedError = z.treeifyError(validateData.error);
      return res
        .status(400)
        .json(errorResponse("Invalid Request", formattedError));
    }

    const { members } = validateData.data;
    const projectId = req.params.id;

    const invalidIds = members.filter((m) => !isUUID(m));
    if (invalidIds.length > 0) {
      return res
        .status(400)
        .json(errorResponse("Invalid userId(s) in the members list"));
    }

    const existingProject = await checkExistingProjectService(projectId);
    if (!existingProject) {
      return res
        .status(404)
        .json(
          errorResponse(
            "Project not found",
            "Project with provided Id does not exists"
          )
        );
    }

    const ensureActive = checkProjectIsActive(
      existingProject,
      "remove members"
    );
    if (ensureActive) {
      return res.status(ensureActive.status).json(ensureActive.response);
    }

    const { isOwner, isManager } = await roleBasedUpdateProjectService(
      projectId,
      req.user.id
    );

    if (!isOwner && !isManager) {
      return res
        .status(403)
        .json(
          errorResponse(
            "Forbidden",
            "Only the project owner or manager can add members to this project"
          )
        );
    }

    const ownerId = existingProject.ownerId;
    if (members.includes(ownerId)) {
      return res
        .status(400)
        .json(errorResponse("You cannot remove the owner of the project"));
    }

    const existingMembers = await checkAddedMembersService(projectId, members);
    const existingIds = existingMembers.map((m) => m.userId);

    const missingIds = members.filter((id) => !existingIds.includes(id));
    if (missingIds.length > 0) {
      return res
        .status(400)
        .json(
          errorResponse(
            "Some provided members are not part of this project",
            missingIds
          )
        );
    }

    const removedMembersDetails = await userDetailsService(existingIds);

    const removedMembers = await db.transaction(async (tx) => {
      return await removeProjectMemberService(projectId, members, tx);
    });

    for (const member of removedMembersDetails) {
      await logActivity({
        projectId,
        actorId: existingProject.ownerId,
        action: "members_removed_from_project",
        metadata: {
          projectName: existingProject.projectName,
          memberId: member.id,
          memberEmail: member.email,
        },
      });
    }

    return res.status(200).json(
      successResponse("Members removed successfully", {
        count: removedMembers?.rowCount || 0,
        removedMembers: removedMembersDetails,
      })
    );
  } catch (error) {
    console.error("Error in Remove-Members-From-Project Controller: ", error);
    return res.status(500).json(errorResponse("Internal Server Error"));
  }
};

export const softDeleteProjectController = async (req, res) => {
  try {
    const projectId = req.params.id;

    if (!projectId || !isUUID(projectId)) {
      return res
        .status(400)
        .json(errorResponse("Invalid Request", "Enter a valid ProjectId"));
    }

    const project = await checkExistingProjectService(projectId);

    if (!project) {
      return res.status(404).json(errorResponse("Project not found"));
    }

    if (project.ownerId !== req.user.id) {
      return res
        .status(403)
        .json(
          errorResponse(
            "Invalid Action",
            "Only owners can deactivate a project"
          )
        );
    }

    if (!project.isActive) {
      return res.status(400).json(errorResponse("Project already deactivated"));
    }

    const result = await deactivateProjectService(projectId);

    if (!result) {
      return res
        .status(500)
        .json(errorResponse("Failed to deactivate the project"));
    }

    await logActivity({
      projectId,
      actorId: req.user.id,
      action: "project_deactivated",
      metadata: {
        projectName: project.projectName,
      },
    });

    return res.status(200).json(
      successResponse("Project Deactivated!", {
        id: result.id,
        name: result.name,
        isActive: result.isActive,
        restoredAt: new Date().toISOString(),
      })
    );
  } catch (error) {
    console.error("Error in Soft-Delete-Project Controller: ", error);
    return res.status(500).json(errorResponse("Internal Server Error"));
  }
};

export const restoreProjectController = async (req, res) => {
  try {
    const projectId = req.params.id;

    if (!projectId || !isUUID(projectId)) {
      return res
        .status(400)
        .json(errorResponse("Invalid Request", "Enter a valid ProjectId"));
    }

    const project = await checkExistingProjectService(projectId);

    if (!project) {
      return res.status(404).json(errorResponse("Project not found"));
    }

    if (project.ownerId !== req.user.id) {
      return res
        .status(403)
        .json(
          errorResponse("Invalid Action", "Only owners can restore a project")
        );
    }

    if (project.isActive) {
      return res.status(400).json(errorResponse("Project is active already"));
    }

    const result = await restoreProjectService(projectId);

    if (!result) {
      return res
        .status(500)
        .json(errorResponse("Failed to restore the project"));
    }

    await logActivity({
      projectId,
      actorId: req.user.id,
      action: "project_restored",
      metadata: {
        projectName: project.projectName,
      },
    });

    return res.status(200).json(
      successResponse("Project Restored Successfully!", {
        id: result.id,
        name: result.name,
        isActive: result.isActive,
        restoredAt: new Date().toISOString(),
      })
    );
  } catch (error) {
    console.error("Error RestoreProject Controller: ", error);
    return res.status(500).json(errorResponse("Internal Server Error"));
  }
};

export const hardDeleteProjectController = async (req, res) => {
  try {
    const projectId = req.params.id;

    if (!projectId || !isUUID(projectId)) {
      return res
        .status(400)
        .json(errorResponse("Invalid Request", "Provide a valid uuid"));
    }

    const existingProject = await checkExistingProjectService(projectId);
    if (!existingProject) {
      return res
        .status(404)
        .json(
          errorResponse(
            "Projet Not Found",
            "Project with provided id does not exists"
          )
        );
    }

    if (existingProject.ownerId !== req.user.id) {
      return res
        .status(403)
        .json(
          errorResponse("Invalid Action", "Only owner can delete the project")
        );
    }

    if (existingProject.isActive) {
      return res
        .status(400)
        .json(
          errorResponse(
            "Invalid Action",
            "You can only delete a project when it is deactivated"
          )
        );
    }

    await deleteProjectService(projectId);

    await logActivity({
      projectId,
      actorId: req.user.id,
      action: "project_deleted_permanently",
      metadata: {
        projectName: existingProject.projectName,
        projectDescription: existingProject.projectDescription,
      },
    });

    return res.status(200).json(
      successResponse("Project deleted successfully", {
        deletedProject: {
          id: projectId,
          name: existingProject.projectName,
          projectDescription: existingProject.projectDescription || " ",
        },
      })
    );
  } catch (error) {
    console.error("Error in Hard Delete Project Controller: ", error);
    return res.status(500).json(errorResponse("Internal Server Error"));
  }
};
