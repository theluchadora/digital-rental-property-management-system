import { Router } from "express";
import * as leaseController from "../controllers/leaseController";
import { authenticateToken, authorizeRoles } from "../auth/authMiddleware";

const router = Router();

router.get("/", authenticateToken, leaseController.list);
router.get("/:id", authenticateToken, leaseController.getById);
router.post("/", authenticateToken, authorizeRoles("OWNER"), leaseController.create);
router.post("/:id/documents", authenticateToken, authorizeRoles("OWNER"), leaseController.uploadDocument);
router.get("/documents/:id/download", authenticateToken, leaseController.downloadDocument);
router.post("/:id/terminate", authenticateToken, leaseController.terminate);
router.post("/:id/move-out-notice", authenticateToken, leaseController.moveOutNotice);
router.post("/:id/remove-tenant", authenticateToken, authorizeRoles("OWNER"), leaseController.removeTenant);

export default router;
