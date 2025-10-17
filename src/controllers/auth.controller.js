import { z } from "zod";
import { registerUserValidation } from "../validation/auth.validation.js";
import { successResponse } from "../utils/response.js";
import { errorResponse } from "../utils/error.js";
import {
  chechExistingUser,
  registerUserService,
} from "../services/user.service.js";

export const registerUserController = async (req, res) => {
  try {
    const validatedResult = await registerUserValidation.safeParseAsync(
      req.body
    );

    if (!validatedResult.success) {
      const formattedError = z.treeifyError(validatedResult.error);
      return res.status(400).json(errorResponse(formattedError));
    }

    const { name, email, password } = validatedResult.data;

    const existingUser = await chechExistingUser(email);

    if (existingUser) {
      return res
        .status(400)
        .json(errorResponse("User Already Exists", "Email is already in Use"));
    }

    const user = await registerUserService({
      name,
      email,
      password,
    });

    return res.status(201).json(
      successResponse("User Registered Successfully", {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      })
    );
  } catch (error) {
    console.error("Register User Error: ", error);
    return res.status(500).json(errorResponse("Internal Server Error"));
  }
};
