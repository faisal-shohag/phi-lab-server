import express from "express";
import { Role } from "../../../generated/prisma/enums";
import { authenticateJWT } from "../../middlewares/authenticate-jwt";
import { JsSeriesController } from "./js-series.controller";

const router = express.Router();


router.get("/series",authenticateJWT(...Object.values(Role)),  JsSeriesController.getJsSeriesList);                  // Public or with progress
router.get("/series-names",authenticateJWT(...Object.values(Role)),  JsSeriesController.    getJsSeriesNameAndId,
);                  // Public or with progress
router.get("/series/:id",authenticateJWT(...Object.values(Role)), JsSeriesController.getJsSeriesById);               // Public or with progress
router.get("/series-organized/:id", authenticateJWT(...Object.values(Role)), JsSeriesController.getJsSingleSeriesByIdAndCategories); // Public or with progress

router.post("/series",authenticateJWT(Role.ADMIN),  JsSeriesController.createJsSeries);                   // Admin
router.patch("/series/:id", authenticateJWT(Role.ADMIN), JsSeriesController.updateJsSeries);              // Admin
router.delete("/series/:id", authenticateJWT(Role.ADMIN),  JsSeriesController.deleteJsSeries);             // Admin

router.post("/series/problem", authenticateJWT(Role.ADMIN),  JsSeriesController.addProblemToSeries);       // Admin
router.delete("/series/:seriesId/problem/:problemId", authenticateJWT(Role.ADMIN),  JsSeriesController.removeProblemFromSeries); // Admin
router.patch("/series/reorder", authenticateJWT(Role.ADMIN),  JsSeriesController.reorderProblemsInSeries); // Admin


export const jsSeriesRoutes = router;