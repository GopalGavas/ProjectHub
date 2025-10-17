export const successResponse = (message, data = null) => ({
  success: true,
  message,
  ...(data && { data }),
});
