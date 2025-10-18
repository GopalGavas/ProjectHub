import { z } from "zod";
import {
  registerUserValidation,
  loginUserValidation,
} from "../validation/auth.validation.js";
import { successResponse } from "../utils/response.js";
import { errorResponse } from "../utils/error.js";
import {
  checkExistingUser,
  registerUserService,
} from "../services/user.service.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/token.js";

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

    const existingUser = await checkExistingUser(email);

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

export const loginUserController = async (req, res) => {
  try {
    const validatedResult = await loginUserValidation.safeParseAsync(req.body);

    if (!validatedResult.success) {
      const formattedError = z.treeifyError(validatedResult.error);
      return res.status(400).json(errorResponse(formattedError));
    }

    const { email, password } = validatedResult.data;

    const existingUser = await checkExistingUser(email);

    if (!existingUser) {
      return res
        .status(404)
        .json(
          errorResponse(
            "User not found",
            "User with provided email does not exists"
          )
        );
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      existingUser.password
    );

    if (!isPasswordValid) {
      return res
        .status(401)
        .json(
          errorResponse(
            "Invalid credentials",
            "You have Entered Incorrect Password"
          )
        );
    }

    const payload = {
      id: existingUser.id,
      email: existingUser.email,
      role: existingUser.role,
    };

    const token = generateToken(payload);

    const responseData = {
      id: existingUser.id,
      email: existingUser.email,
      role: existingUser.role,
    };

    if (process.env.NODE_ENV !== "production") {
      responseData.token = token;
    }

    res
      .status(200)
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json(successResponse("User logged in Successfully", responseData));
  } catch (error) {
    console.error("Login User Error: ", error);
    return res.status(500).json(errorResponse("Internal Server Error"));
  }
};
