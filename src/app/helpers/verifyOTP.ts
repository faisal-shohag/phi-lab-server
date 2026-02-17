import { prisma } from "../config/db";
import { hashString } from "../utils/crypto";
export const verifyOTPOnly = async (
  email:string,
  otp: string,
)=> {

  const otpHash = hashString(otp);

  // Find and verify OTP
  const record = await prisma.oTP.findFirst({
    where: {
        email,
      codeHash: otpHash,
      expiresAt: { gt: new Date() },
      used: false,
    }
  });

  if (!record) return false;


  // delete verified otp
  await prisma.oTP.delete({
    where: { email: record.email },
  });

  return {email: record.email}
};
