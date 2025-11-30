import { errorResponse } from "./error.js";
import { checkExistingProjectService } from "../services/project.service.js";
import {
  checkExistingTaskService,
  checkMemberService,
} from "../services/task.service.js";
import { checkExistingCommentService } from "../services/comments.service.js";
import { validate as isUUID } from "uuid";

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

export const validateProjectAndTask = async (
  projectId,
  taskId,
  { allowedDeleted = false } = {}
) => {
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

  if (task.isDeleted && !allowedDeleted) {
    return {
      isValid: false,
      status: 400,
      message: "Invalid Request",
      details: "The task you're trying to update is deleted",
    };
  }

  return { isValid: true, task };
};

export const validateProjectAndComment = async (
  projectId,
  commentId,
  userId
) => {
  if (!isUUID(projectId)) {
    throw {
      status: 400,
      message: "Invalid Project Id",
      details: "Enter a valid Project Id",
    };
  }

  if (!isUUID(commentId)) {
    throw {
      status: 400,
      message: "Invalid Comment Id",
      details: "Enter a valid Comment Id",
    };
  }

  const [project, comment, isMember] = await Promise.all([
    checkExistingProjectService(projectId),
    checkExistingCommentService(commentId),
    checkMemberService(projectId, userId),
  ]);

  if (!project) {
    throw {
      status: 404,
      message: "Project not found",
      details: "Project with given Id does not exists",
    };
  }

  if (!comment) {
    throw {
      status: 404,
      message: "Comment not found",
      details: "Comment with given Id does not exists",
    };
  }

  if (!isMember) {
    throw {
      status: 403,
      message: "Forbidden Request",
      details: "Only Project Members can perform this action",
    };
  }

  return {
    project,
    comment,
    isMember,
  };
};
