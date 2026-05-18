import { Router } from "express";
import * as propertyController from "../controllers/propertyController";
import { authenticateToken } from "../auth/authMiddleware";

const router = Router();

// Create a property (requires authentication)
router.post("/", authenticateToken, propertyController.createProperty);

// List properties
router.get("/", propertyController.listProperties);

// Get vacant properties
router.get("/vacant", propertyController.getVacantProperties);

// Get properties by owner
router.get("/owner/:ownerId", propertyController.getPropertiesByOwner);

// Units under a property
router.get("/:propertyId/units/vacant", propertyController.getVacantUnitsUnderProperty);
router.get("/:propertyId/units", propertyController.getUnitsUnderProperty);

// Get a single property
router.get("/:id", propertyController.getPropertyById);

// Update a property
router.patch("/:id", authenticateToken, propertyController.updateProperty);

export default router;

