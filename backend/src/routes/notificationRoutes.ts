import { Router } from "express";
import * as notificationController from "../controllers/notificationController";
import { authenticateToken } from "../auth/authMiddleware";

const router = Router();

router.get("/", authenticateToken, notificationController.getMyNotifications);
router.post("/read/:id", authenticateToken, notificationController.markNotificationAsRead);

export default router;
