import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Router } from "express";
import { authenticateToken } from "./auth/authMiddleware";
import { initializePayment, paymentWebhook, checkPaymentStatus } from './controllers/paymentController';
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./swagger";



import userRoutes from "./routes/userRoutes";
import propertyRoutes from "./routes/propertyRoutes";
import photoRoutes from "./routes/photoRoutes";
import notificationRoutes from "./routes/notificationRoutes";

const app = express();
// Allow credentials (cookies) to be sent from the browser
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Swagger UI (served at /api/docs) -- configure to include credentials so cookies are sent
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    swaggerOptions: {
      requestInterceptor: (req: any) => {
        req.credentials = "include";
        return req;
      },
    },
  })
);

const router = Router();

// Mount user routes under /api/users
router.use("/users", userRoutes);

// Mount property routes under /api/properties
router.use("/properties", propertyRoutes);


router.use("/photos", photoRoutes);

// Mount notification routes under /api/notifications
router.use("/notifications", notificationRoutes);

// payment routes
router.post('/payments/initialize', initializePayment);
router.post('/payments/webhook', paymentWebhook);  
router.get('/payments/verify/:tx_ref', checkPaymentStatus);  

app.use("/api", router);

export default app;