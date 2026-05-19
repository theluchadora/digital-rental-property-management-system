import { Request, Response } from "express";
import { z } from "zod";
import * as invoicesService from "../services/invoicesService";
import * as paymentReceiptsService from "../services/paymentReceiptsService";
import * as leasesRepo from "../repositories/leasesRepository";

const receiptSchema = z.object({
	fileUrl: z.string().url(),
	fileName: z.string().optional(),
	amount: z.number(),
	paymentDate: z.string(),
	transactionRef: z.string().optional(),
	notes: z.string().optional(),
});

const reviewSchema = z.object({
	status: z.enum(["PAID", "UNPAID"]),
	reviewNote: z.string().optional(),
});

export const list = async (req: Request & { user?: { id: string; role: string } }, res: Response) => {
	try {
		const { status, leaseId, billingMonth, page = "1", limit = "20" } = req.query as Record<string, string>;
		const role = req.user?.role;
		const userId = req.user?.id;

		const where: any = {};
		if (status) where.status = status;
		if (leaseId) where.leaseId = leaseId;
		if (billingMonth) where.billingMonth = new Date(billingMonth);

		if (role === "TENANT" && userId) where.tenantId = userId;
		if (role === "OWNER" && userId) where.lease = { ownerId: userId };

		const result = await invoicesService.listInvoices(where, Number(page), Number(limit));
		res.json(result);
	} catch (err: any) {
    console.error("Error caught in invoiceController.ts:", err);
		res.status(500).json({ error: err.message || "Failed to list invoices" });
	}
};

export const getById = async (req: Request, res: Response) => {
	try {
		const invoice = await invoicesService.getInvoice(req.params.id as string);
		if (!invoice) return res.status(404).json({ error: "Invoice not found" });
		res.json({ invoice });
	} catch (err: any) {
    console.error("Error caught in invoiceController.ts:", err);
		res.status(500).json({ error: err.message || "Failed to get invoice" });
	}
};

export const uploadReceipt = async (req: Request & { user?: { id: string } }, res: Response) => {
	try {
		const body = receiptSchema.parse(req.body);
		const invoiceId = req.params.id as string;

		const receipt = await paymentReceiptsService.addPaymentReceipt({
			invoiceId,
			fileUrl: body.fileUrl,
			fileName: body.fileName,
			amount: body.amount,
			paymentDate: new Date(body.paymentDate),
			transactionRef: body.transactionRef,
			notes: body.notes,
			uploadedBy: req.user?.id,
		});

		await invoicesService.updateInvoice(invoiceId, { status: "PENDING_REVIEW" } as any);
		const invoice = await invoicesService.getInvoice(invoiceId);

		res.status(201).json({ receipt, invoice });
	} catch (err: any) {
    console.error("Error caught in invoiceController.ts:", err);
		res.status(400).json({ error: err.message || "Failed to upload receipt" });
	}
};

export const downloadReceipt = async (req: Request, res: Response) => {
	try {
		const receipt = await paymentReceiptsService.getPaymentReceiptById(req.params.id as string);
		if (!receipt) return res.status(404).json({ error: "Receipt not found" });
		res.redirect(receipt.fileUrl);
	} catch (err: any) {
    console.error("Error caught in invoiceController.ts:", err);
		res.status(500).json({ error: err.message || "Failed to download receipt" });
	}
};

export const reviewStatus = async (req: Request & { user?: { id: string } }, res: Response) => {
	try {
		const body = reviewSchema.parse(req.body);
		const invoice = await invoicesService.reviewInvoiceStatus(req.params.id as string, {
			status: body.status,
			reviewNote: body.reviewNote,
			reviewerId: req.user?.id,
		});
		res.json({ invoice });
	} catch (err: any) {
    console.error("Error caught in invoiceController.ts:", err);
		res.status(400).json({ error: err.message || "Failed to review invoice" });
	}
};

export const generateMonthly = async (_req: Request, res: Response) => {
	try {
		const now = new Date();
		const billingMonth = new Date(now.getFullYear(), now.getMonth(), 1);
		const result = await invoicesService.generateMonthlyInvoices(billingMonth);
		res.json({ message: "Monthly invoices generated", billingMonth: billingMonth.toISOString(), ...result });
	} catch (err: any) {
    console.error("Error caught in invoiceController.ts:", err);
		res.status(500).json({ error: err.message || "Failed to generate invoices" });
	}
};
