import { Router } from "express";
import * as userController from "../controllers/userController";
import { authenticateToken } from "../auth/authMiddleware";

const router = Router();

router.post("/register", userController.register);
router.post("/login", userController.login);
router.get("/", userController.list);
router.get("/search", authenticateToken, userController.search);
router.get("/me", authenticateToken, userController.getMe);
router.patch("/me", authenticateToken, userController.update);
router.delete("/me", authenticateToken, userController.remove);
router.post("/logout", authenticateToken, userController.logout);

export default router;


