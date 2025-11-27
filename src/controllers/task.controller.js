import {
  checkExistingProjectService,
  checkExistingUsersService,
  roleBasedUpdateProjectService,
} from "../services/project.service.js";
import {
  checkExistingTaskService,
  checkMemberService,
  createTaskService,
  deleteTaskService,
  getAllTasksService,
  getTaskByIdService,
  restoreTaskService,
  softDeleteTaskService,
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
import { logActivity } from "../services/activity.service.js";

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

    await logActivity({
      projectId,
      taskId: newTask.id,
      actorId: req.user.id,
      action: "task_created",
      metadata: {
        title: newTask.title,
        priority: newTask.priority,
      },
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

    const oldTask = validation.task;

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

    const changes = {};

    if (title && title !== oldTask.title) {
      changes.title = {
        old: oldTask.title,
        new: updatedTask.title,
      };
    }

    if (description && description !== oldTask.description) {
      changes.description = {
        old: oldTask.description,
        new: updatedTask.description,
      };
    }

    if (priority && priority !== oldTask.priority) {
      changes.priority = {
        old: oldTask.priority,
        new: updatedTask.priority,
      };
    }

    if (assignedTo && assignedTo !== oldTask.assignedTo) {
      changes.assignedTo = {
        old: oldTask.assignedTo,
        new: updatedTask.assignedTo,
      };
    }

    if (dueDate && dueDate !== oldTask.dueDate) {
      changes.dueDate = {
        old: oldTask.dueDate,
        new: updatedTask.dueDate,
      };
    }

    // Only log if something changed
    if (Object.keys(changes).length > 0) {
      await logActivity({
        projectId,
        taskId,
        actorId: req.user.id,
        action: "task_details_updated",
        metadata: { changes },
      });
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

    if (!(isOwner || isManager || task.assignedTo === req.user.id)) {
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

    await logActivity({
      projectId,
      taskId,
      actorId: req.user.id,
      action: "update_task_status",
      metadata: {
        oldStatus: task.status,
        newStatus: updatedTask.status,
      },
    });

    return res
      .status(200)
      .json(successResponse("Task Status Updated Successfully", updatedTask));
  } catch (error) {
    console.error("Error in Create Task Controller: ", error);
    return res.status(500).json(errorResponse("Internal Server Error"));
  }
};

export const softDeleteTaskController = async (req, res) => {
  try {
    const { projectId, taskId } = req.params;

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
            "Only project owners and managers can delete a task"
          )
        );
    }

    const deactivatedTask = await softDeleteTaskService(taskId);
    if (!deactivatedTask) {
      return res
        .status(400)
        .json(
          errorResponse(
            "Internal Server Error",
            "Something went wrong while deleting task"
          )
        );
    }

    await logActivity({
      projectId,
      taskId,
      actorId: req.user.id,
      action: "task_deactivated",
      metadata: {
        id: deactivatedTask.id,
        title: deactivatedTask.title,
      },
    });

    return res
      .status(200)
      .json(successResponse("Task deleted Successfully", deactivatedTask));
  } catch (error) {
    console.error("Error in Soft Delete Task Controller: ", error);
    return res.status(500).json(errorResponse("Internal Server Error"));
  }
};

export const restoreTaskController = async (req, res) => {
  try {
    const { projectId, taskId } = req.params;

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

    const validation = await validateProjectAndTask(projectId, taskId, {
      allowedDeleted: true,
    });

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
            "Only project owners and managers can delete a task"
          )
        );
    }

    const restoredTask = await restoreTaskService(taskId);
    if (!restoredTask) {
      return res
        .status(400)
        .json(
          errorResponse(
            "Internal Server Error",
            "Something went wrong while deleting task"
          )
        );
    }

    await logActivity({
      projectId,
      taskId,
      actorId: req.user.id,
      action: "task_restored",
      metadata: {
        id: restoredTask.id,
        title: restoredTask.title,
      },
    });

    return res
      .status(200)
      .json(successResponse("Task Restored Successfully", restoredTask));
  } catch (error) {
    console.error("Error in Restore Task Controller: ", error);
    return res.status(500).json(errorResponse("Internal Server Error"));
  }
};

export const deleteTaskController = async (req, res) => {
  try {
    const { projectId, taskId } = req.params;

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

    const validation = await validateProjectAndTask(projectId, taskId, {
      allowedDeleted: true,
    });

    if (!validation.isValid) {
      return res
        .status(validation.status)
        .json(errorResponse(validation.message, validation.details));
    }

    const project = await checkExistingProjectService(projectId);
    if (req.user.id !== project.ownerId) {
      return res
        .status(403)
        .json(
          errorResponse(
            "Unauthorized Request",
            "Only project owners can permanently delete tasks"
          )
        );
    }

    const task = await checkExistingTaskService(taskId);

    if (!task.isDeleted) {
      return res
        .status(400)
        .json(
          errorResponse(
            "Invalid Request",
            "Task must be soft deleted before permanent deletion"
          )
        );
    }

    await deleteTaskService(taskId);

    await logActivity({
      projectId,
      taskId,
      actorId: req.user.id,
      action: "task_deleted_permanently",
      metadata: {
        id: task.id,
        title: task.title,
      },
    });

    return res.status(200).json(successResponse("Task Permanently Deleted!"));
  } catch (error) {
    console.error("Error in Delete Task Controller: ", error);
    return res.status(500).json(errorResponse("Internal Server Error"));
  }
};

export const getAllTasksController = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const {
      status,
      priority,
      assignee,
      search,
      sortBy = "createdAt",
      order = "desc",
      page = 1,
      limit = 10,
    } = req.query;

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
            "Only Project Owners and Managers can view all tasks"
          )
        );
    }

    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const offset = (pageInt - 1) * limitInt;

    const filters = {
      status,
      priority,
      assignee,
      search,
      sortBy,
      order,
    };

    const { tasks, totalCount } = await getAllTasksService(
      projectId,
      offset,
      limitInt,
      filters
    );

    return res.status(200).json(
      successResponse("Tasks fetched Successfully", {
        tasks,
        pagination: {
          totalCount,
          page: pageInt,
          limit: limitInt,
          totalPages: Math.ceil(totalCount / limitInt),
        },
      })
    );
  } catch (error) {
    console.error("Error in Get All Tasks Controller: ", error);
    return res.status(500).json(errorResponse("Internal Server Error"));
  }
};
