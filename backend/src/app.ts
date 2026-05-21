import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Router } from "express";
import { authenticateToken } from "./auth/authMiddleware";
import { initializePayment, paymentWebhook, checkPaymentStatus } from './controllers/paymentController';
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./swagger";
import { httpLogger } from "./utils/logger";



import userRoutes from "./routes/userRoutes";
import propertyRoutes from "./routes/propertyRoutes";
import photoRoutes from "./routes/photoRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import leaseRoutes from "./routes/leaseRoutes";
import invoiceRoutes from "./routes/invoiceRoutes";
import maintenanceRoutes from "./routes/maintenanceRoutes";
import announcementsRoutes from "./routes/announcementsRoutes";
import incidentsRoutes from "./routes/incidentsRoutes";
import unitsRoutes from "./routes/unitsRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import messagesRoutes from "./routes/messagesRoutes";

const app = express();
app.disable("etag");
// Allow credentials (cookies) to be sent from the browser
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(httpLogger);
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
  }
  next();
});
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

// Lease, invoice, maintenance, announcements, incidents
router.use("/leases", leaseRoutes);
router.use("/invoices", invoiceRoutes);
router.use("/maintenance-requests", maintenanceRoutes);
router.use("/announcements", announcementsRoutes);
router.use("/incidents", incidentsRoutes);
router.use("/units", unitsRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/messages", messagesRoutes);

// payment routes
router.post('/payments/initialize', initializePayment);
router.post('/payments/webhook', paymentWebhook);  
router.get('/payments/verify/:tx_ref', checkPaymentStatus);  

app.use("/api", router);
app.use("/api/v1", router);
app.use("/api/v1/api", router);

export default app;