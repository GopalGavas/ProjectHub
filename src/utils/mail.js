import { Resend } from "resend";

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
    console.error("Send Email Error:", error);
    throw new Error("Email not sent");
  }
};
