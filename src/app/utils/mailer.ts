import nodemailer from "nodemailer";
import { envVars } from "../config/env";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: envVars.SMTP_EMAIL,
    pass: envVars.SMTP_PASS,
  },
});

export async function sendEmail(to: string, subject: string, html: string) {
  return transporter.sendMail({
    from: envVars.SMTP_EMAIL,
    to,
    subject,
    html,
  });
}
