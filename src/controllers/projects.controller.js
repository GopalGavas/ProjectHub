import { successResponse } from "../utils/response.js";
import { errorResponse } from "../utils/error.js";
import { createProjectValidation } from "../validation/project.validation.js";
import { z } from "zod";
import {
  addProjectMembersService,
  checkExistingUsersService,
  createProjectService,
  getProjectByIdService,
} from "../services/project.service.js";
import { validate as isUUID } from "uuid";
import { db } from "../db/index.js";

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

export const getAllProjectsController = async (req, res) => {
  try {
  } catch (error) {
    console.error("Error in Get All Projects Controller: ", error);
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
