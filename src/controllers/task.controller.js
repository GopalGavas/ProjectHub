import {
  checkExistingProjectService,
  checkExistingUsersService,
  roleBasedUpdateProjectService,
} from "../services/project.service.js";
import {
  checkMemberService,
  createTaskService,
} from "../services/task.service.js";
import { errorResponse } from "../utils/error.js";
import { successResponse } from "../utils/response.js";
import { createTaskValidation } from "../validation/task.validation.js";
import { z } from "zod";

export const createTaskController = async (req, res) => {
  try {
    const validateData = await createTaskValidation.safeParseAsync(req.body);
    if (!validateData.success) {
      const formattedError = z.treeifyError(validateData.error);
      return res
        .status(400)
        .json(errorResponse("Invalid Request", formattedError));
    }
    const { title, description, status, priority, assignedTo, dueDate } =
      validateData.data;
    const projectId = req.params.projectId;

    const project = await checkExistingProjectService(projectId);

    if (!project) {
      return res
        .status(404)
        .json(
          errorResponse(
            "Project not found",
            `Project with provided id:${projectId} does not exist`
          )
        );
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
            "Invalid request",
            "Only Project Owners and Managers can create a task"
          )
        );
    }

    if (assignedTo) {
      const existingUser = await checkExistingUsersService([assignedTo]);
      if (existingUser.length === 0) {
        return res
          .status(404)
          .json(
            errorResponse(
              "User not found",
              `User with the provided id(s):${assignedTo} does not exist or is inactive`
            )
          );
      }
    }

    const isMember = await checkMemberService(projectId, assignedTo);

    if (!isMember) {
      return res
        .status(403)
        .json(
          errorResponse(
            "Invalid Assignment",
            "Cannot assign a task to a user who is not part of the project"
          )
        );
    }

    const newTask = await createTaskService({
      projectId,
      title,
      description,
      assignedTo: assignedTo || null,
      status,
      priority,
      dueDate,
    });

    return res
      .status(201)
      .json(successResponse("Task Created Successfully", newTask));
  } catch (error) {
    console.error("Error in Create Task Controller: ", error);
    return res.status(500).json(errorResponse("Internal Server Error"));
  }
};
