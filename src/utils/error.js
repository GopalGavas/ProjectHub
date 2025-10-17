export const errorResponse = (message, details = null) => ({
  success: false,
  error: {
    message,
    ...(details && { details }),
  },
});
