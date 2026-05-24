import { Router } from "express";
import * as messagesController from "../controllers/messagesController";
import { authenticateToken } from "../auth/authMiddleware";

const router = Router();

router.use(authenticateToken);

router.get("/conversations", messagesController.getConversations);
router.put("/conversation/read", messagesController.markConversationRead);
router.get("/", messagesController.list);
router.get("/:messageId", messagesController.getById);
router.post("/", messagesController.send);
router.put("/:messageId/read", messagesController.markRead);

export default router;
