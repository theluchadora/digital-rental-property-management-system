import { Router } from "express";
import * as unitsController from "../controllers/unitsController";
import { authenticateToken, authorizeRoles } from "../auth/authMiddleware";

const router = Router();

router.get("/", authenticateToken, unitsController.list);
router.get("/:id", authenticateToken, unitsController.getById);
router.patch("/:id", authenticateToken, authorizeRoles("OWNER"), unitsController.update);
router.delete("/:id", authenticateToken, authorizeRoles("OWNER"), unitsController.remove);

export default router;
