import { errorResponse } from "./error.js";

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
