import { Router } from "express";
import * as incidentsController from "../controllers/incidentsController";
import { authenticateToken } from "../auth/authMiddleware";

const router = Router();

router.get("/", authenticateToken, incidentsController.list);
router.get("/:id", authenticateToken, incidentsController.getById);
router.post("/", authenticateToken, incidentsController.create);
router.post("/:id/evidence", authenticateToken, incidentsController.uploadEvidence);
router.get("/evidence/:id/download", authenticateToken, incidentsController.downloadEvidence);

export default router;
