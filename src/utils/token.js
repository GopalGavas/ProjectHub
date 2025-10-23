import jwt from "jsonwebtoken";
import crypto from "crypto";

export const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "7d",
    issuer: "ProjectHub",
  });
};

export const resetPassToken = () => {
  const token = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const expires = Date.now() + 15 * 60 * 1000;

  return { token, hashedToken, expires };
};
