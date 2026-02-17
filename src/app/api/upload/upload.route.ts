import express from "express";
import { Role } from "../../../generated/prisma/enums";
import { authenticateJWT } from "../../middlewares/authenticate-jwt";
import { UploadControllers } from "./upload.controller";
const router = express.Router();
router.post("/cloudinary", authenticateJWT(Role.ADMIN),  UploadControllers.CloudinaryUpload);
router.get("/cloudinary", authenticateJWT(Role.ADMIN), UploadControllers.CloudinaryGetImages)
router.delete("/cloudinary", authenticateJWT(Role.ADMIN),  UploadControllers.CloudinaryDeleteImage);
router.post("/profile", authenticateJWT(Role.ADMIN), UploadControllers.CloudinaryUploadProfileImage);

export const uploadRoutes = router;