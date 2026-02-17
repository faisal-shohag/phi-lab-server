"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.otpEmailHTML = void 0;
const env_1 = require("../config/env");
const otpEmailHTML = (otpPlain) => {
    return `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <h2 style="color: #4f46e5; margin-bottom: 10px;">Fantastic Code Verification</h2>
      <p>Dear User,</p>
      <p>Your One-Time Password (OTP) is:</p>
      
      <center style="font-size: 22px; font-weight: bold; color: #111; margin: 20px 0;">
        ${otpPlain}
      </center>

      <p>This code is valid for <strong>${env_1.envVars.OTP_EXPIRES_MIN || "10"} minutes</strong>.  
      Please use it to complete your login or verification process.</p>

      <p>If you did not request this, you can safely ignore this email.</p>

      <p>Best regards,<br/>  
      <strong>Fantastic Code Team</strong></p>
    </div>
  `;
};
exports.otpEmailHTML = otpEmailHTML;
