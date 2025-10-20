import { errorResponse } from "../utils/error.js";
import { successResponse } from "../utils/response.js";
import {
  checkExistingUser,
  getUserById,
  updateUserData,
} from "../services/user.service.js";
import { validateUserDetails } from "../validation/user.validation.js";
import { z } from "zod";

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

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

    return res.status(200).json(
      successResponse("User Profile Fetched Successfully", {
        user,
      })
    );
  } catch (error) {
    console.error("User Get Profile Error: ", error);
    return res.status(500).json(errorResponse("Internal Server Error"));
  }
};

export const updateUserDetails = async (req, res) => {
  try {
    const validateData = await validateUserDetails.safeParseAsync(req.body);
    if (!validateData.success) {
      const formattedError = z.treeifyError(validateData.error);
      return res
        .status(400)
        .json(errorResponse("Invalid Request", formattedError));
    }

    const { name, email } = validateData.data;
    const userId = req.params.id;

    const user = await getUserById(userId);

    if (user.id !== req.user.id && req.user.role !== "admin") {
      return res
        .status(401)
        .json(
          errorResponse(
            "Unauthorized action",
            "You do not have authority to update the user information"
          )
        );
    }

    let formattedEmail;
    if (email && email !== user.email) {
      formattedEmail = email.toLowerCase();
      const conflictingEmail = await checkExistingUser(formattedEmail);
      if (conflictingEmail && conflictingEmail.id !== user.id) {
        return res
          .status(400)
          .json(errorResponse("Email already in use", "Use Another Email"));
      }
    }

    const updatedData = {};
    if (name) updatedData.name = name;
    if (email) updatedData.email = formattedEmail;

    const updatedUser = await updateUserData(updatedData, req.user.id);

    return res
      .status(200)
      .json(successResponse("User Details Updated Successfully", updatedUser));
  } catch (error) {
    console.error("Update User Details", error);
    return res.status(500).json(errorResponse("Internal Server Error"));
  }
};
