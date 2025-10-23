import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, text, html) => {
  console.log("SMTP_MAIL: ", process.env.SMTP_MAIL);
  console.log("SMTP_PASS: ", process.env.SMTP_PASS);
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"ProjectHub" <${process.env.SMTP_MAIL}>`,
      to,
      subject,
      text,
      html,
    });

    return info;
  } catch (error) {
    console.error("Send Email Error: ", error);
    throw new Error("Email not sent");
  }
};
