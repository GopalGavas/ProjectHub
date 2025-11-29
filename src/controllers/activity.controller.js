import { successResponse } from "../utils/response.js";
import { errorResponse } from "../utils/error.js";
import { validate as isUUID } from "uuid";
import {
  checkExistingProjectService,
  roleBasedUpdateProjectService,
} from "../services/project.service.js";
import {
  getActivitiesByProjectService,
  getActivitiesByTaskService,
  getActivitiesByUserService,
} from "../services/activity.service.js";
import { checkExistingTaskService } from "../services/task.service.js";
import { getUserById } from "../services/user.service.js";

export const getActivitiesByProjectController = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { page = 1, limit = 1 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (!isUUID(projectId)) {
      return res
        .status(400)
        .json(errorResponse("Invalid Request", "Not a valid Project Id"));
    }

    const existingProject = await checkExistingProjectService(projectId);

    if (!existingProject) {
      return res
        .status(404)
        .json(
          errorResponse(
            "Project Not Found",
            "Project with provided Id does not exists"
          )
        );
    }

    const { isManager, isOwner } = await roleBasedUpdateProjectService(
      projectId,
      req.user.id
    );

    if (!isManager && !isOwner && req.user.role !== "admin") {
      return res
        .status(403)
        .json(
          errorResponse(
            "Unauthorized Request",
            "You are not authorized for this action"
          )
        );
    }

    const projectActivities = await getActivitiesByProjectService(
      projectId,
      pageNum,
      limitNum
    );

    return res.status(200).json(
      successResponse("Activities related to project fetched successfully", {
        activities: projectActivities,
      })
    );
  } catch (error) {
    console.error("Error in get activity for project controller", error);
    return res.status(500).json(errorResponse("Internal Server Error"));
  }
};

export const getActivitiesByTaskController = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (!isUUID(taskId)) {
      return res
        .status(400)
        .json(errorResponse("Invalid Request", "Not a valid Project Id"));
    }

    const existingTask = await checkExistingTaskService(taskId);

    if (!existingTask) {
      return res
        .status(404)
        .json(
          errorResponse(
            "Task not found",
            "Task with provided Id does not exists"
          )
        );
    }

    const { isManager, isOwner } = await roleBasedUpdateProjectService(
      projectId,
      req.user.id
    );

    if (!isManager && !isOwner && req.user.role !== "admin") {
      return res
        .status(403)
        .json(
          errorResponse(
            "Unauthorized Request",
            "You are not authorized for this action"
          )
        );
    }

    const taskActivities = await getActivitiesByTaskService(
      taskId,
      pageNum,
      limitNum
    );

    return res.status(200).json(
      successResponse("Activites Related to Task fetched Successfully", {
        activities: taskActivities,
      })
    );
  } catch (error) {
    console.error("Error in get activity for project controller", error);
    return res.status(500).json(errorResponse("Internal Server Error"));
  }
};

export const getActivitesByUserController = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (!isUUID(userId)) {
      return res
        .status(400)
        .json(errorResponse("Invalid Request", "Not a valid User Id"));
    }

    const existingUser = await getUserById(userId);
    if (!existingUser) {
      return res
        .status(404)
        .json(
          errorResponse(
            "User not found",
            "User with provided Id does not exists"
          )
        );
    }

    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json(
          errorResponse(
            "Forbidden Action",
            "Only admins have permission to perform this action"
          )
        );
    }

    const userActivities = await getActivitiesByUserService(
      userId,
      pageNum,
      limitNum
    );

    return res.status(200).json(
      successResponse("User activities fetched successfully", {
        activities: userActivities,
      })
    );
  } catch (error) {
    console.error("Error in Get Activities By user controller: ", error);
    return res.status(500).json(errorResponse("Internal Server Error"));
  }
};
