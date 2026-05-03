import { Resend } from "resend";
import logger from "./logger.js";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (to, subject, text, html) => {
  try {
    const response = await resend.emails.send({
      from: "ProjectHub <onboarding@resend.dev>",
      to,
      subject,
      html: html || undefined,
      text: text || undefined,
    });

    return response;
  } catch (error) {
    logger.error({ err: error }, "Send Email Error");
    throw new Error("Email not sent");
  }
};
