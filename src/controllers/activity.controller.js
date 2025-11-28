import { successResponse } from "../utils/response.js";
import { errorResponse } from "../utils/error.js";
import { validate as isUUID } from "uuid";
import {
  checkExistingProjectService,
  roleBasedUpdateProjectService,
} from "../services/project.service.js";
import { getActivitiesByProjectService } from "../services/activity.service.js";

export const getAllActivitiesForAdminController = async (req, res) => {
  try {
  } catch (error) {}
};

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

    return res
      .status(200)
      .json(
        successResponse("Activities fetched successfully", projectActivities)
      );
  } catch (error) {
    console.error("Error in get activity for project controller", error);
    return res.status(500).json(errorResponse("Internal Server Error"));
  }
};

export const getActivitiesByTaskController = async (req, res) => {
  try {
    const { taskId } = req.params;
  } catch (error) {
    console.error("Error in get activity for project controller", error);
    return res.status(500).json(errorResponse("Internal Server Error"));
  }
};

export const getActivitesByUserControllerv = async (req, res) => {
  try {
  } catch (error) {}
};
