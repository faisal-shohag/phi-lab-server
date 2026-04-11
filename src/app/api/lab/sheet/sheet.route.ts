import { Router } from "express";
import { sheetsController } from "./sheet.controller";

const router = Router();

router.post("/", sheetsController.addData);
router.get("/", sheetsController.getData);
router.put("/", sheetsController.updateData);

export const sheetsRoute = router;