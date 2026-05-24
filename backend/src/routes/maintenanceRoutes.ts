import { Router } from "express";
import * as maintenanceController from "../controllers/maintenanceController";
import { authenticateToken, authorizeRoles } from "../auth/authMiddleware";

const router = Router();

router.get("/", authenticateToken, maintenanceController.list);
router.get(
  "/leasable-properties",
  authenticateToken,
  authorizeRoles("TENANT"),
  maintenanceController.getLeasableProperties
);
router.get("/:id", authenticateToken, maintenanceController.getById);
router.post("/", authenticateToken, authorizeRoles("TENANT"), maintenanceController.create);
router.put("/:id/status", authenticateToken, authorizeRoles("OWNER"), maintenanceController.updateStatus);
router.post("/:id/evidence", authenticateToken, authorizeRoles("TENANT"), maintenanceController.uploadEvidence);
router.get("/evidence/:id/download", authenticateToken, maintenanceController.downloadEvidence);

export default router;
