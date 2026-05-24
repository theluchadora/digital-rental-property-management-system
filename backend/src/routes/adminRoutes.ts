import { Router } from "express";
import { authenticateToken, authorizeRoles } from "../auth/authMiddleware";
import * as adminController from "../controllers/adminController";

const router = Router();

router.use(authenticateToken, authorizeRoles("ADMIN"));

router.get("/stats", adminController.getStats);
router.get("/reports/overview", adminController.getReportsOverview);

router.get("/users", adminController.listUsers);
router.put("/users/:id/status", adminController.updateUserStatus);
router.delete("/users/:id", adminController.removeUser);
router.post("/users/bulk-status", adminController.bulkUserStatus);
router.post("/users/bulk-delete", adminController.bulkDeleteUsers);
router.post("/create-admin", adminController.createAdmin);

router.get("/properties", adminController.listProperties);
router.post("/properties/bulk-status", adminController.bulkPropertyStatus);
router.post("/properties/bulk-delete", adminController.bulkDeleteProperties);

router.get("/leases", adminController.listLeases);
router.post("/leases/bulk-status", adminController.bulkLeaseStatus);

router.get("/invoices", adminController.listInvoices);
router.get("/maintenance", adminController.listMaintenance);
router.get("/messages", adminController.listMessages);
router.get("/notifications", adminController.listNotifications);

router.get("/incidents", adminController.listIncidents);
router.get("/incidents/:id", adminController.getIncident);
router.patch("/incidents/:id/status", adminController.patchIncidentStatus);

export default router;
