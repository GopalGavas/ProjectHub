import { getAllUsers, getUserById } from "../services/user.service.js";
import { errorResponse } from "../utils/error.js";
import { successResponse } from "../utils/response.js";
import { validate as isUUID } from "uuid";

export const fetchUserByIdController = async (req, res) => {
  try {
    const userId = req.params.id;

    if (!userId || !isUUID(userId)) {
      return res
        .status(400)
        .json(errorResponse("Invalid Request", "Please provide proper userId"));
    }

    const user = await getUserById(userId);

    if (!user) {
      return res
        .status(404)
        .json(
          errorResponse(
            "User Not found",
            `User with id:${userId} does not exists`
          )
        );
    }

    return res.status(200).json(
      successResponse("User fetched successfully", {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      })
    );
  } catch (error) {
    console.error("ADMIN: Get User by Id error: ", error);
    return res.status(500).json(errorResponse("Internal Server Error"));
  }
};

export const getAllUsersController = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const { users, totalCount } = await getAllUsers({
      offset,
      limit: limitNum,
      search,
    });

    return res.status(200).json(
      successResponse("All Users fetched Successfully", {
        data: users,
        pagination: {
          total: totalCount,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalCount / limitNum),
        },
      })
    );
  } catch (error) {
    console.error("ADMIN: Get All Users Error: ", error);
    return res.status(500).json(errorResponse("Internal Server Error"));
  }
};
