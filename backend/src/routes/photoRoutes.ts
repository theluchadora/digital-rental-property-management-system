import { Router } from "express";
import * as photoController from "../controllers/photoController";
import { authenticateToken } from "../auth/authMiddleware";

const router = Router();

// Public route - get all photos for a property
router.get("/property/:propertyId", photoController.getPropertyPhotos);

// Protected routes (require authentication)
router.post("/", authenticateToken, photoController.uploadPhoto);
router.delete("/:photoId", authenticateToken, photoController.deletePhoto);
router.patch("/:photoId", authenticateToken, photoController.updatePhoto);

export default router;