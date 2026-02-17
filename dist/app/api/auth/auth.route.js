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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("./auth.controller");
const auth_validation_1 = require("./auth.validation");
const passport_google_1 = __importDefault(require("../../config/passport-google"));
const env_1 = require("../../config/env");
const router = express_1.default.Router();
router.post("/register", auth_validation_1.registerValidation, auth_controller_1.registerController);
router.post("/login", auth_validation_1.loginValidation, auth_controller_1.loginWithPasswordConroller);
router.post("/request-otp", auth_controller_1.requestOTPController);
router.post("/verify-otp", auth_controller_1.verifyOTPController);
router.post("/reset-password", auth_validation_1.passwordValidation, auth_controller_1.resetPasswordController);
router.post("/logout", auth_controller_1.logoutController);
router.post("/refresh", auth_controller_1.refreshController);
router.get("/google", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const redirect = req.query.redirect || "/";
    passport_google_1.default.authenticate("google", {
        scope: ["profile", "email"],
        state: redirect,
    })(req, res, next);
}));
router.get("/google/callback", passport_google_1.default.authenticate("google", {
    failureRedirect: `${env_1.envVars.CLIENT_URL}/login?error=There was an error when sign in with google.`,
    session: false,
}), auth_controller_1.googleOAuth);
router.get("/github", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const redirect = req.query.redirect || "/";
    passport_google_1.default.authenticate("github", {
        scope: ['user:email'],
        state: redirect,
    })(req, res, next);
}));
router.get("/github/callback", passport_google_1.default.authenticate("github", {
    failureRedirect: `${env_1.envVars.CLIENT_URL}/login?error=There was an error when sign in with github.`,
    session: false,
}), auth_controller_1.googleOAuth);
exports.authRoutes = router;
