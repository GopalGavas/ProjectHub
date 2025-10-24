import { errorResponse } from "../utils/error.js";
import { successResponse } from "../utils/response.js";
import {
  checkExistingUser,
  comparePassword,
  getUserById,
  updateUserData,
  updateUserPassword,
} from "../services/user.service.js";
import {
  validateUserDetails,
  changePasswordValidation,
} from "../validation/user.validation.js";
import { z } from "zod";

export const getUserProfileController = async (req, res) => {
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
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      })
    );
  } catch (error) {
    console.error("User Get Profile Error: ", error);
    return res.status(500).json(errorResponse("Internal Server Error"));
  }
};

export const updateUserDetailsController = async (req, res) => {
  try {
    const validateData = await validateUserDetails.safeParseAsync(req.body);
    if (!validateData.success) {
      const formattedError = z.treeifyError(validateData.error);
      return res
        .status(400)
        .json(errorResponse("Invalid Request", formattedError));
    }

    const { name, email } = validateData.data;
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

export const changePasswordController = async (req, res) => {
  try {
    const validateData = await changePasswordValidation.safeParseAsync(
      req.body
    );

    if (!validateData.success) {
      const formattedError = z.treeifyError(validateData.error);
      return res
        .status(400)
        .json(errorResponse("Invalid Request", formattedError));
    }

    const { oldPassword, newPassword } = validateData.data;
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

    const isPasswordCorrect = await comparePassword(oldPassword, user.password);

    if (!isPasswordCorrect) {
      return res
        .status(401)
        .json(
          errorResponse("Incorrect Password", "Your Old Password did not match")
        );
    }

    const updatedUser = await updateUserPassword(req.user.id, newPassword);

    if (!updatedUser) {
      return res
        .status(400)
        .json(
          errorResponse("Something went wrong while updating the password")
        );
    }

    res.clearCookie("token");

    return res
      .status(200)
      .json(
        successResponse("Password Updated Successfully", "Please Login Again")
      );
  } catch (error) {
    console.error("Update Password failed: ", error);
    return res.status(500).json(errorResponse("Internal server error"));
  }
};
