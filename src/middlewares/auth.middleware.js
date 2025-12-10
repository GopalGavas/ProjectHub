import jwt from "jsonwebtoken";
import { errorResponse } from "../utils/error.js";
import { getUserById } from "../services/user.service.js";

export const authenticateUser = async (req, res, next) => {
  try {
    const token =
      req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json(errorResponse("Unauthorized Access", "You are not logged In"));
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    const user = await getUserById(decodedToken.id);

    if (!user) {
      return res
        .status(401)
        .json(errorResponse("Unauthorized", "User not found"));
    }

    if (!user.isActive) {
      return res
        .status(401)
        .json(errorResponse("Account Disabled", "Contact support"));
    }

    if (user.tokenVersion !== decodedToken.tokenVersion) {
      return res
        .status(401)
        .json(errorResponse("Session Expired", "Please login again"));
    }

    req.user = user;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json(
          errorResponse(
            "session expired",
            "Your token has expired, Please Login again"
          )
        );
    }

    return res
      .status(401)
      .json(errorResponse("Access Denied", "Invalid Token"));
  }
};

export const authoriseRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user?.role)) {
      return res
        .status(403)
        .json(
          errorResponse(
            "Access Denied",
            "You are not Authorized for this action"
          )
        );
    }
    next();
  };
};
