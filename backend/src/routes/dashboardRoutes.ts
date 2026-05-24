import { Router } from "express";
import * as dashboardController from "../controllers/dashboardController";
import { authenticateToken } from "../auth/authMiddleware";

const router = Router();

router.get("/owner/stats", authenticateToken, dashboardController.getOwnerStats);
router.get("/owner/overview", authenticateToken, dashboardController.getOwnerOverview);
router.get("/tenant/stats", authenticateToken, dashboardController.getTenantStats);
router.get("/activities", authenticateToken, dashboardController.getActivities);

export default router;
