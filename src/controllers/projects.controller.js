import { successResponse } from "../utils/response.js";
import { errorResponse } from "../utils/error.js";

export const createProjectController = async (req, res) => {
  try {
  } catch (error) {
    console.error("Error in Create Project Controller: ", error);
    return res.status(500).json(errorResponse("Internal Server Error"));
  }
};
