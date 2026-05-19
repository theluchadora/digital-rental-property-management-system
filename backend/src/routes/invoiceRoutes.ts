import { Router } from "express";
import * as invoiceController from "../controllers/invoiceController";
import { authenticateToken, authorizeRoles } from "../auth/authMiddleware";

const router = Router();

router.get("/", authenticateToken, invoiceController.list);
router.get("/:id", authenticateToken, invoiceController.getById);
router.post("/:id/receipts", authenticateToken, authorizeRoles("TENANT"), invoiceController.uploadReceipt);
router.get("/receipts/:id/download", authenticateToken, invoiceController.downloadReceipt);
router.put("/:id/status", authenticateToken, authorizeRoles("OWNER"), invoiceController.reviewStatus);
router.post("/generate-monthly", authenticateToken, authorizeRoles("OWNER"), invoiceController.generateMonthly);

export default router;
