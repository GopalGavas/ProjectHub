import jwt from "jsonwebtoken";
import { errorResponse } from "../utils/error.js";

export const authenticateUser = (req, res, next) => {
  try {
    const token =
      req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json(errorResponse("Unauthorized Access", "You are not logged In"));
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decodedToken;

    next();
  } catch (error) {
    console.error("Auth Middleware Error: ", error);

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
      console.log(
        "Authorized Roles:",
        allowedRoles,
        "User Role:",
        req.user?.role
      );

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
