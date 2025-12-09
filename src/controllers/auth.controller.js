import { z } from "zod";
import {
  registerUserValidation,
  loginUserValidation,
  generateResetPassTokenValidation,
  resetPasswordValidation,
} from "../validation/auth.validation.js";
import { successResponse } from "../utils/response.js";
import { errorResponse } from "../utils/error.js";
import {
  checkExistingUser,
  comparePassword,
  registerUserService,
  setResetPassToken,
  findUserWithToken,
  updatePasswordAndResetToken,
} from "../services/user.service.js";
import { generateToken, resetPassToken } from "../utils/token.js";
import { sendEmail } from "../utils/mail.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { checkIsUserActive } from "../utils/user.status.js";

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
    return res
      .status(500)
      .json(errorResponse("Internal Server Error", error.message));
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

    checkIsUserActive(existingUser);

    const isPasswordValid = await comparePassword(
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
      tokenVersion: existingUser.tokenVersion,
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
    return res
      .status(500)
      .json(errorResponse("Internal Server Error", error.message));
  }
};

export const logoutUserController = async (_, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res
      .status(200)
      .json(successResponse("User Logged out successfully"));
  } catch (error) {
    return res
      .status(500)
      .json(errorResponse("Internal Server error", error.message));
  }
};

export const generateResetPassTokenController = async (req, res) => {
  try {
    const validateData = await generateResetPassTokenValidation.safeParseAsync(
      req.body
    );
    if (!validateData.success) {
      const formattedError = z.treeifyError(validateData.error);
      return res
        .status(400)
        .json(errorResponse("Invalid Request", formattedError));
    }

    const { email } = validateData.data;

    const user = await checkExistingUser(email);

    if (!user) {
      return res
        .status(404)
        .json(
          errorResponse(
            "User not found",
            "User with this email does not exists"
          )
        );
    }

    checkIsUserActive(user);

    const { token, hashedToken, expires } = resetPassToken();

    await setResetPassToken(hashedToken, expires, user.id);

    const resetUrl = `${process.env.FRONTEND_URL}/reset-token/${token}`;

    await sendEmail(
      email,
      "Reset your password",
      `Hello ${user.name}, reset your password using this link: ${resetUrl}`,
      `<p>Hello ${user.name},</p>
       <p>Click the link below to reset your password:</p>
       <a href="${resetUrl}">Reset Password</a>
       <p>This link is valid for only 15 minutes.</p>`
    );

    return res
      .status(200)
      .json(successResponse("Password reset link sent to your email"));
  } catch (error) {
    return res
      .status(500)
      .json(errorResponse("Internal Server Error", error.message));
  }
};

export const resetPasswordController = async (req, res) => {
  try {
    const validateData = await resetPasswordValidation.safeParseAsync(req.body);
    if (!validateData.success) {
      const formattedError = z.treeifyError(validateData.error);
      return res
        .status(400)
        .json(errorResponse("Invalid Request", formattedError));
    }
    const { newPassword } = validateData.data;
    const { token } = req.params;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await findUserWithToken(hashedToken);
    if (!user) {
      return res
        .status(400)
        .json(
          errorResponse(
            "Invalid or expired token",
            "Please request a new reset link"
          )
        );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await updatePasswordAndResetToken(user.id, hashedPassword);

    return res
      .status(200)
      .json(successResponse("Password reset successfull, you can now login"));
  } catch (error) {
    return res
      .status(500)
      .json(errorResponse("Internal Server Error", error.message));
  }
};
