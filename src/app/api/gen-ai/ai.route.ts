import express from "express";
import { AiControllers } from "./ai.controller";
const router = express.Router();

router.get('/gemini/stream', AiControllers.geminiStream)



export const aiRoutes = router
