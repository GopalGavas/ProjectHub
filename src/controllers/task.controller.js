import {
  checkExistingProjectService,
  checkExistingUsersService,
  roleBasedUpdateProjectService,
} from "../services/project.service.js";
import {
  checkExistingTaskService,
  checkMemberService,
  createTaskService,
  getTaskByIdService,
  updateTaskService,
  updateTaskStatusService,
} from "../services/task.service.js";
import { errorResponse } from "../utils/error.js";
import { successResponse } from "../utils/response.js";
import {
  createTaskValidation,
  updateTaskStatusValidation,
  updateTaskValidation,
} from "../validation/task.validation.js";
import { z } from "zod";
import { validate as isUUID } from "uuid";
import { validateProjectAndTask } from "../utils/project.utils.js";

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

    if (!isUUID(projectId)) {
      return res
        .status(400)
        .json(errorResponse("Invalid Project Id", "Enter a valid Project Id"));
    }

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
            "Unauthorized Action",
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

export const getTaskByIdController = async (req, res) => {
  try {
    const taskId = req.params.taskId;

    if (!taskId || !isUUID(taskId)) {
      return res
        .status(400)
        .json(errorResponse("Invalid Request", "Provide a valid Task uuid"));
    }

    const task = await getTaskByIdService(taskId);

    if (!task) {
      return res
        .status(404)
        .json(errorResponse("Task with provided Id does not exist"));
    }

    return res
      .status(200)
      .json(successResponse("Task fetched Successfully", task));
  } catch (error) {
    console.error("Error in Get Task By Id Controller: ", error);
    return res.status(500).json(errorResponse("Internal Server Error"));
  }
};

export const updateTaskController = async (req, res) => {
  try {
    const validateData = await updateTaskValidation.safeParseAsync(req.body);

    if (!validateData.success) {
      const formattedError = z.treeifyError(validateData.error);
      return res
        .status(400)
        .json(errorResponse("Invalid Request", formattedError));
    }

    const { title, description, priority, assignedTo, dueDate } =
      validateData.data;
    const projectId = req.params.projectId;
    const taskId = req.params.taskId;

    if (!isUUID(projectId) || !isUUID(taskId)) {
      return res
        .status(400)
        .json(
          errorResponse(
            `Invalid ${!isUUID(projectId) ? "Project" : "Task"} Id`,
            `Enter a valid ${!isUUID(projectId) ? "Project" : "Task"} Id`
          )
        );
    }

    const validation = await validateProjectAndTask(projectId, taskId);

    if (!validation.isValid) {
      return res
        .status(validation.status)
        .json(errorResponse(validation.message, validation.details));
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
            "Unauthorized Action",
            "Only project owners and managers can update the project"
          )
        );
    }

    if (assignedTo && typeof assignedTo === "string") {
      const existingUser = await checkExistingUsersService([assignedTo]);
      if (!existingUser) {
        return res
          .status(404)
          .json(
            errorResponse(
              "User not found",
              `User with the provided id(s):${assignedTo} does not exist or is inactive`
            )
          );
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
    }

    const updatedTask = await updateTaskService(projectId, taskId, {
      title,
      description,
      priority,
      assignedTo,
      dueDate,
    });

    if (!updatedTask) {
      return res
        .status(500)
        .json(errorResponse("Error while updating the task"));
    }

    return res
      .status(200)
      .json(successResponse("Tasks updated  Successfully", updatedTask));
  } catch (error) {
    console.error("Error in Create Task Controller: ", error);
    return res.status(500).json(errorResponse("Internal Server Error"));
  }
};

export const updateTaskStatusController = async (req, res) => {
  try {
    const validateData = await updateTaskStatusValidation.safeParseAsync(
      req.body
    );
    if (!validateData.success) {
      const formattedError = z.treeifyError(validateData.error);
      return res
        .status(400)
        .json(errorResponse("Invalid Request", formattedError));
    }

    const { status } = validateData.data;
    const projectId = req.params.projectId;
    const taskId = req.params.taskId;

    if (!isUUID(projectId) || !isUUID(taskId)) {
      return res
        .status(400)
        .json(
          errorResponse(
            `Invalid ${!isUUID(projectId) ? "Project" : "Task"} Id`,
            `Enter a valid ${!isUUID(projectId) ? "Project" : "Task"} Id`
          )
        );
    }

    const validation = await validateProjectAndTask(projectId, taskId);

    if (!validation.isValid) {
      return res
        .status(validation.status)
        .json(errorResponse(validation.message, validation.details));
    }

    const task = await checkExistingTaskService(taskId);

    const { isOwner, isManager } = await roleBasedUpdateProjectService(
      projectId,
      req.user.id
    );

    if (!(isOwner || isManager || task.assignedTo !== req.user.id)) {
      return res
        .status(403)
        .json(
          errorResponse(
            "Unauthorized Request",
            "Only the user(s) assigned to tasks can update task-status"
          )
        );
    }

    if (task.status === status) {
      return res
        .status(400)
        .json(errorResponse("Project already has that status"));
    }

    const updatedTask = await updateTaskStatusService(status, taskId);
    if (!updatedTask) {
      return res
        .status(400)
        .json(
          errorResponse(
            "Internal Server Error",
            "Something went wrong while updating task status"
          )
        );
    }

    return res
      .status(200)
      .json(successResponse("Task Status Updated Successfully", updatedTask));
  } catch (error) {
    console.error("Error in Create Task Controller: ", error);
    return res.status(500).json(errorResponse("Internal Server Error"));
  }
};
