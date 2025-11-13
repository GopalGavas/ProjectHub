import { errorResponse } from "./error.js";
import { checkExistingProjectService } from "../services/project.service.js";
import { checkExistingTaskService } from "../services/task.service.js";

export const checkProjectIsActive = (
  project,
  action = "perform this action"
) => {
  if (!project.isActive) {
    return {
      status: 400,
      response: errorResponse(
        "Inactive Project",
        `Cannot ${action} on a deactivated project`
      ),
    };
  }

  return null;
};

export const validateProjectAndTask = async (projectId, taskId) => {
  const [project, task] = await Promise.all([
    checkExistingProjectService(projectId),
    checkExistingTaskService(taskId),
  ]);

  if (!project) {
    return {
      isValid: false,
      status: 404,
      message: "Project not found",
      details: `Project with ID: ${projectId} does not exist`,
    };
  }

  if (!task) {
    return {
      isValid: false,
      status: 404,
      message: "Task not found",
      details: `Task with ID: ${taskId} does not exist`,
    };
  }

  if (task.isDeleted) {
    return {
      isValid: false,
      status: 400,
      message: "Invalid Request",
      details: "The task you're trying to update is deleted",
    };
  }

  return { isValid: true };
};
