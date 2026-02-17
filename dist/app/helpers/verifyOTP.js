"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOTPOnly = void 0;
const db_1 = require("../config/db");
const crypto_1 = require("../utils/crypto");
const verifyOTPOnly = (email, otp) => __awaiter(void 0, void 0, void 0, function* () {
    const otpHash = (0, crypto_1.hashString)(otp);
    // Find and verify OTP
    const record = yield db_1.prisma.oTP.findFirst({
        where: {
            email,
            codeHash: otpHash,
            expiresAt: { gt: new Date() },
            used: false,
        }
    });
    if (!record)
        return false;
    // delete verified otp
    yield db_1.prisma.oTP.delete({
        where: { email: record.email },
    });
    return { email: record.email };
});
exports.verifyOTPOnly = verifyOTPOnly;
