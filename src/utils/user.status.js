import { errorResponse } from "./error.js";

export const checkIsUserActive = (user) => {
  if (!user.isActive) {
    const error = errorResponse(
      "Account Disabled",
      "Your account is deactivated. Contact support."
    );
    error.status = 403;
    throw error;
  }
};
