import {
  getAllUsers,
  getUserById,
  restoreUser,
  softDeleteUser,
  updateUserRole,
} from "../services/user.service.js";
import { errorResponse } from "../utils/error.js";
import { successResponse } from "../utils/response.js";
import { validate as isUUID } from "uuid";
import { updateUserRoleValidation } from "../validation/admin.validation.js";
import { z } from "zod";

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

export const updateUserRoleController = async (req, res) => {
  try {
    const validateData = await updateUserRoleValidation.safeParseAsync(
      req.body
    );

    if (!validateData.success) {
      const formattedError = z.treeifyError(validateData.error);
      return res
        .status(400)
        .json(errorResponse("Invalid Request", formattedError));
    }

    const { role } = validateData.data;
    const userId = req.params.id;

    const user = await getUserById(userId);

    if (!user) {
      return res
        .status(404)
        .json(
          errorResponse(
            "User not found",
            `User with id:${userId} does not exists`
          )
        );
    }

    if (user.role === role) {
      return res.status(200).json(
        successResponse("User role already set", {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        })
      );
    }

    const updatedUser = await updateUserRole(role, userId);

    return res
      .status(200)
      .json(successResponse("User role updated successfully", updatedUser));
  } catch (error) {
    console.error("ADMIN: Update User Role Error: ", error);
    return res.status(500).json(errorResponse("Internal Server Error"));
  }
};

export const deleteUserController = async (req, res) => {
  try {
    const userId = req.params.id;

    if (!userId || !isUUID(userId)) {
      return res
        .status(400)
        .json(errorResponse("Invalid Request", "Enter a valid userId"));
    }

    const user = await getUserById(userId);

    if (!user) {
      return res
        .status(404)
        .json(
          errorResponse(
            "User not found",
            `User with id:${userId} does not exists`
          )
        );
    }

    if (!user.isActive) {
      return res.status(200).json(
        successResponse("User is already deleted", {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
        })
      );
    }

    const deletedUser = await softDeleteUser(userId);

    return res.status(200).json(
      successResponse("User deleted Successfully", {
        id: deletedUser.id,
        name: deletedUser.name,
        email: deletedUser.email,
        role: deletedUser.role,
        isActive: deletedUser.isActive,
      })
    );
  } catch (error) {
    console.error("DELETE USER CONTROLLER (ADMIN) ERROR: ", error);
    return res.status(500).json(errorResponse("Internal server Error"));
  }
};

export const restoreUserController = async (req, res) => {
  try {
    const userId = req.params.id;

    if (!userId || !isUUID(userId)) {
      return res
        .status(400)
        .json(errorResponse("Invalid Request", "Enter a valid userId"));
    }

    const user = await getUserById(userId);

    if (!user) {
      return res
        .status(404)
        .json(
          errorResponse(
            "User not found",
            `User with id:${userId} does not exists`
          )
        );
    }

    if (user.isActive) {
      return res.status(200).json(
        successResponse("User is already active", {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
        })
      );
    }

    const restoredUser = await restoreUser(userId);

    return res.status(200).json(
      successResponse("User Restored Successfully", {
        id: restoredUser.id,
        name: restoredUser.name,
        email: restoredUser.email,
        role: restoredUser.role,
        isActive: restoredUser.isActive,
      })
    );
  } catch (error) {
    console.error("DELETE USER CONTROLLER (ADMIN) ERROR: ", error);
    return res.status(500).json(errorResponse("Internal server Error"));
  }
};
