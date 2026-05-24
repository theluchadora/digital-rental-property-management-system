import { Router } from "express";
import * as announcementsController from "../controllers/announcementsController";
import { authenticateToken, authorizeRoles } from "../auth/authMiddleware";

const router = Router();

router.get("/", authenticateToken, announcementsController.list);
router.post("/mark-read", authenticateToken, announcementsController.markRead);
router.post("/", authenticateToken, authorizeRoles("OWNER"), announcementsController.create);

export default router;
