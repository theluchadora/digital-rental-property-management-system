import { Request, Response } from "express";
import axios from "axios";
import crypto from "crypto";
import * as invoicesService from "../services/invoicesService";
import * as leasesRepo from "../repositories/leasesRepository";
import * as propertiesService from "../services/propertiesService";

const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY || '';
const CHAPA_API_URL = "https://api.chapa.co/v1/transaction";

// Store paid tx_refs (in production, use database)
const paidTransactions = new Set<string>();

export const initializePayment = async (req: Request, res: Response) => {
  try {
    const { amount, email, first_name, last_name, phone_number } = req.body;

    const tx_ref = `tx-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;

    const payload = {
      amount: String(amount),
      currency: "ETB",
      email: email || "test@example.com",
      first_name: first_name || "Test",
      last_name: last_name || "User",
      phone_number: phone_number || "0911111111",
      tx_ref: tx_ref,
      // return_url ??
      customization: {
        title: "Rent",
        description: "Payment",
      },
    };

    const response = await axios.post(
      `${CHAPA_API_URL}/initialize`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({
      checkout_url: response.data.data.checkout_url,
      tx_ref,
    });
  } catch (error: any) {
    console.error("Error caught in paymentController.ts:", error);
    res.status(500).json({ error: "Payment initialization failed" });
  }
};

// Webhook - Chapa calls this when payment is done
export const paymentWebhook = async (req: Request, res: Response) => {
  try {
    const { tx_ref, status, reference } = req.body;
    
    console.log("📞 Webhook received:", { tx_ref, status, reference });

    if (status === 'success' && tx_ref) {
      // Verify with Chapa to be sure
      const verifyResponse = await axios.get(
        `${CHAPA_API_URL}/verify/${tx_ref}`,
        { headers: { Authorization: `Bearer ${CHAPA_SECRET_KEY}` } }
      );

      if (verifyResponse.data.status === 'success') {
        // Mark as paid
        paidTransactions.add(tx_ref);
        console.log("✅ Payment confirmed:", tx_ref);
        
        // In production: Update database
        // await db.invoices.update({ status: 'PAID' }, { where: { tx_ref } });
      }
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error.message);
    res.status(500).send("Error");
  }
};

// Frontend checks this to verify payment
export const checkPaymentStatus = async (req: Request, res: Response) => {
  const tx_ref = req.params.tx_ref as string;
  const invoiceId = (req.query.invoiceId as string) || undefined;
  
  if (paidTransactions.has(tx_ref)) {
    if (invoiceId) {
      const invoice = await invoicesService.updateInvoice(invoiceId, {
        status: "PAID",
        paidAt: new Date(),
      } as any);
      const lease = await leasesRepo.getLeaseById(invoice.leaseId);
      if (lease) {
        await leasesRepo.updateLease(lease.id, { status: "ACTIVE" } as any);
        await propertiesService.updateProperty(lease.propertyId, { status: "OCCUPIED" });
      }
    }
    res.json({ status: 'paid' });
  } else {
    // Double check with Chapa
    try {
      const response = await axios.get(
        `${CHAPA_API_URL}/verify/${tx_ref}`,
        { headers: { Authorization: `Bearer ${CHAPA_SECRET_KEY}` } }
      );
      
      if (response.data.status === 'success') {
        paidTransactions.add(tx_ref);
        if (invoiceId) {
          const invoice = await invoicesService.updateInvoice(invoiceId, {
            status: "PAID",
            paidAt: new Date(),
          } as any);
          const lease = await leasesRepo.getLeaseById(invoice.leaseId);
          if (lease) {
            await leasesRepo.updateLease(lease.id, { status: "ACTIVE" } as any);
            await propertiesService.updateProperty(lease.propertyId, { status: "OCCUPIED" });
          }
        }
        res.json({ status: 'paid' });
      } else {
        res.json({ status: 'pending' });
      }
    } catch {
    console.error("Error caught in paymentController.ts:", new Error("Unknown error caught"));
      res.json({ status: 'pending' });
    }
  }
};