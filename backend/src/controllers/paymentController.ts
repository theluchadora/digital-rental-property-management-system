import { Request, Response } from "express";
import axios from "axios";
import crypto from "crypto";
import * as invoicesService from "../services/invoicesService";
import * as leasesRepo from "../repositories/leasesRepository";
import * as propertiesService from "../services/propertiesService";
import logger from "../utils/logger";

const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY || "";
const CHAPA_API_URL = "https://api.chapa.co/v1/transaction";
const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
const IS_TEST_MODE = CHAPA_SECRET_KEY.includes("TEST");

/** Chapa test-mode phones that always succeed — see https://developer.chapa.co/test/testing-mobile */
const CHAPA_TEST_PHONES = ["0900123456", "0900112233", "0900881111", "0700123456", "0700112233", "0700881111"];

const paidTransactions = new Set<string>();

function parseAmount(raw: unknown): string {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error("Invalid payment amount");
  }
  return n.toFixed(2);
}

/** Normalize to 10-digit 09xxxxxxxx / 07xxxxxxxx for Chapa. */
function normalizePhone(raw: unknown): string {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (!digits) return IS_TEST_MODE ? CHAPA_TEST_PHONES[0] : "0912345678";

  if (digits.startsWith("251") && digits.length >= 12) {
    const local = digits.slice(3);
    if (local.length === 9) return `0${local}`;
  }
  if (digits.length === 9 && (digits.startsWith("9") || digits.startsWith("7"))) {
    return `0${digits}`;
  }
  if (digits.length === 10 && (digits.startsWith("09") || digits.startsWith("07"))) {
    return digits;
  }

  return IS_TEST_MODE ? CHAPA_TEST_PHONES[0] : "0912345678";
}

function resolveCallbackUrl(): string | undefined {
  const url = process.env.CHAPA_CALLBACK_URL?.trim();
  if (!url) return undefined;
  if (/localhost|127\.0\.0\.1/i.test(url)) {
    logger.warn("CHAPA_CALLBACK_URL is localhost — omitted (Chapa cannot reach it)");
    return undefined;
  }
  return url;
}

function buildReturnUrl(txRef: string, invoiceId?: string): string {
  const params = new URLSearchParams({ chapa_return: "1", tx_ref: txRef });
  if (invoiceId) params.set("invoice_id", invoiceId);
  return `${FRONTEND_URL}/payments?${params.toString()}`;
}

/** True only when the payment itself succeeded (not just the HTTP API wrapper). */
function chapaPaymentSucceeded(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const root = body as Record<string, unknown>;
  const inner = root.data;
  if (inner && typeof inner === "object") {
    return (inner as Record<string, unknown>).status === "success";
  }
  return false;
}

async function markInvoicePaid(invoiceId: string) {
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

export const initializePayment = async (req: Request, res: Response) => {
  try {
    if (!CHAPA_SECRET_KEY) {
      return res.status(503).json({
        error: "Chapa is not configured. Set CHAPA_SECRET_KEY in the backend environment.",
      });
    }

    const { amount, email, first_name, last_name, phone_number, invoice_id } = req.body;
    const tx_ref = `tx-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    const phone = normalizePhone(phone_number);

    const payload: Record<string, unknown> = {
      amount: parseAmount(amount),
      currency: "ETB",
      email: String(email || "tenant@gmail.com").trim(),
      first_name: first_name || "Tenant",
      last_name: last_name || "User",
      phone_number: phone,
      tx_ref,
      return_url: buildReturnUrl(tx_ref, invoice_id),
      customization: {
        title: "Rent Payment",
        description: invoice_id ? `Invoice payment` : "Rent payment",
      },
    };

    if (invoice_id) {
      payload.meta = { invoice_id: String(invoice_id) };
    }

    const callbackUrl = resolveCallbackUrl();
    if (callbackUrl) {
      payload.callback_url = callbackUrl;
    }

    logger.info({ tx_ref, amount: payload.amount, phone, testMode: IS_TEST_MODE }, "Chapa initialize");

    const response = await axios.post(`${CHAPA_API_URL}/initialize`, payload, {
      headers: {
        Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const checkoutUrl =
      response.data?.data?.checkout_url ?? response.data?.checkout_url;

    if (!checkoutUrl) {
      logger.error({ data: response.data }, "Chapa initialize missing checkout_url");
      return res.status(502).json({ error: "Chapa did not return a checkout URL" });
    }

    res.json({
      checkout_url: checkoutUrl,
      tx_ref,
      test_mode: IS_TEST_MODE,
      test_phones: IS_TEST_MODE ? CHAPA_TEST_PHONES : undefined,
      phone_used: phone,
    });
  } catch (error: unknown) {
    const axiosErr = error as { response?: { data?: unknown }; message?: string };
    const raw = (axiosErr.response?.data as { message?: unknown })?.message;
    let chapaMessage = "Payment initialization failed";
    if (typeof raw === "string") chapaMessage = raw;
    else if (raw && typeof raw === "object") {
      chapaMessage = Object.entries(raw as Record<string, string[]>)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
        .join("; ");
    } else if (axiosErr.message) {
      chapaMessage = axiosErr.message;
    }
    logger.error({ err: axiosErr.response?.data || axiosErr.message }, "Chapa initialize failed");
    res.status(500).json({ error: chapaMessage });
  }
};

/** Chapa redirects the customer's browser here after payment (GET). */
export const paymentCallback = async (req: Request, res: Response) => {
  const trxRef = (req.query.trx_ref || req.query.tx_ref) as string | undefined;
  const status = req.query.status as string | undefined;
  const invoiceId = req.query.invoice_id as string | undefined;

  logger.info({ trxRef, status, query: req.query }, "Chapa browser callback");

  if (trxRef && status === "success") {
    paidTransactions.add(trxRef);
    if (invoiceId) {
      try {
        await markInvoicePaid(invoiceId);
      } catch (err) {
        logger.error({ err, invoiceId }, "Callback: failed to mark invoice paid");
      }
    }
  }

  const params = new URLSearchParams({ chapa_return: "1" });
  if (trxRef) params.set("tx_ref", trxRef);
  if (invoiceId) params.set("invoice_id", invoiceId);
  if (status) params.set("status", status);

  res.redirect(`${FRONTEND_URL}/payments?${params.toString()}`);
};

export const paymentWebhook = async (req: Request, res: Response) => {
  try {
    const body = req.method === "GET" ? req.query : req.body;
    const tx_ref = (body.tx_ref || body.trx_ref) as string | undefined;
    const status = body.status as string | undefined;

    logger.info({ tx_ref, status, method: req.method }, "Chapa webhook/callback");

    if (status === "success" && tx_ref) {
      const verifyResponse = await axios.get(`${CHAPA_API_URL}/verify/${tx_ref}`, {
        headers: { Authorization: `Bearer ${CHAPA_SECRET_KEY}` },
      });

      if (chapaPaymentSucceeded(verifyResponse.data)) {
        paidTransactions.add(tx_ref);
        logger.info({ tx_ref }, "Chapa payment confirmed via webhook");
      }
    }

    res.status(200).json({ received: true });
  } catch (error: unknown) {
    const err = error as { message?: string };
    logger.error({ err: err.message }, "Webhook error");
    res.status(500).send("Error");
  }
};

export const checkPaymentStatus = async (req: Request, res: Response) => {
  const tx_ref = req.params.tx_ref as string;
  const invoiceId = (req.query.invoiceId as string) || undefined;

  const finalizePaid = async () => {
    if (invoiceId) {
      try {
        await markInvoicePaid(invoiceId);
      } catch (err) {
        logger.error({ err, invoiceId }, "Failed to update invoice after payment");
      }
    }
    return res.json({ status: "paid" });
  };

  if (paidTransactions.has(tx_ref)) {
    return finalizePaid();
  }

  try {
    if (!CHAPA_SECRET_KEY) {
      return res.json({ status: "pending" });
    }

    const response = await axios.get(`${CHAPA_API_URL}/verify/${tx_ref}`, {
      headers: { Authorization: `Bearer ${CHAPA_SECRET_KEY}` },
    });

    logger.debug({ tx_ref, chapa: response.data }, "Chapa verify response");

    if (chapaPaymentSucceeded(response.data)) {
      paidTransactions.add(tx_ref);
      return finalizePaid();
    }

    const innerStatus = (response.data as { data?: { status?: string } })?.data?.status;
    return res.json({ status: "pending", chapa_status: innerStatus ?? "unknown" });
  } catch (err) {
    logger.warn({ tx_ref, err }, "Chapa verify request failed");
    return res.json({ status: "pending" });
  }
};
