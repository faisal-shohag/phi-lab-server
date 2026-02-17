import express, { NextFunction, Request, Response } from "express";
import {
  googleOAuth,
  loginWithPasswordConroller,
  logoutController,
  refreshController,
  registerController,
  requestOTPController,
  resetPasswordController,
  verifyOTPController,
} from "./auth.controller";
import {
  loginValidation,
  passwordValidation,
  registerValidation,
} from "./auth.validation";
import passport from "../../config/passport-google";
import { envVars } from "../../config/env";

const router = express.Router();

router.post("/register", registerValidation, registerController);
router.post("/login", loginValidation, loginWithPasswordConroller);
router.post("/request-otp", requestOTPController);
router.post("/verify-otp", verifyOTPController);
router.post("/reset-password", passwordValidation, resetPasswordController);
router.post("/logout", logoutController);
router.post("/refresh", refreshController);

router.get(
  "/google",
  async (req:any|Request, res: Response, next: NextFunction) => {
    const redirect = req.query.redirect || "/";
    passport.authenticate("google", {
      scope: ["profile", "email"],
      state: redirect as string,
    })(req, res, next);
  }
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${envVars.CLIENT_URL}/login?error=There was an error when sign in with google.`,
    session: false,
  }),
  googleOAuth
);


router.get(
  "/github",
  async (req:any|Request, res: Response, next: NextFunction) => {
    const redirect = req.query.redirect || "/";
    passport.authenticate("github", {
    scope: ['user:email'],
      state: redirect as string,
    })(req, res, next);
  }
);

router.get(
  "/github/callback",
  passport.authenticate("github", {
    failureRedirect: `${envVars.CLIENT_URL}/login?error=There was an error when sign in with github.`,
    session: false,
  }),
  googleOAuth
);

export const authRoutes = router;
