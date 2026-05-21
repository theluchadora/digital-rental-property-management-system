import { Request, Response } from "express";
import { z } from "zod";
import * as leasesService from "../services/leasesService";
import * as leaseDocumentsService from "../services/leaseDocumentsService";
import * as propertiesService from "../services/propertiesService";

const createLeaseSchema = z.object({
	unitId: z.string(),
	tenantId: z.string().optional(),
	tenantEmail: z.string().email().optional(),
	startDate: z.string(),
	endDate: z.string(),
	monthlyRent: z.number(),
	depositAmount: z.number().optional(),
});

const uploadDocSchema = z.object({
	fileUrl: z.string().url(),
	fileName: z.string().optional(),
	documentType: z.string().optional(),
});

const terminateSchema = z.object({
	reason: z.string().min(1),
});

const moveOutSchema = z.object({
	noticeDate: z.string(),
	note: z.string().optional(),
});

const applySchema = z.object({
	propertyId: z.string(),
});

const decisionSchema = z.object({
	accept: z.boolean(),
});

export const list = async (req: Request & { user?: { id: string; role: string } }, res: Response) => {
	try {
		const { status, page = "1", limit = "20" } = req.query as Record<string, string>;
		const role = req.user?.role;
		const userId = req.user?.id;

		let leases = [] as any[];
		if (role === "OWNER" && userId) {
			leases = await leasesService.getLeasesByOwnerId(userId);
		} else if (role === "TENANT" && userId) {
			leases = await leasesService.getLeasesByTenantId(userId);
		} else {
			leases = await leasesService.getLeasesByOwnerId(userId || "");
		}

		const filtered = status ? leases.filter((l) => l.status === status) : leases;
		const start = (Number(page) - 1) * Number(limit);
		const paginated = filtered.slice(start, start + Number(limit));

		res.json({
			data: paginated,
			total: filtered.length,
			page: Number(page),
			totalPages: Math.ceil(filtered.length / Number(limit)) || 1,
		});
	} catch (err: any) {
    console.error("Error caught in leaseController.ts:", err);
		res.status(500).json({ error: err.message || "Failed to list leases" });
	}
};

export const apply = async (req: Request & { user?: { id: string; role: string } }, res: Response) => {
	try {
		const body = applySchema.parse(req.body);
		const tenantId = req.user?.id;
		if (!tenantId) return res.status(401).json({ error: "Unauthorized" });

		await leasesService.initiateLease(body.propertyId, tenantId);
		res.status(201).json({ message: "Lease request submitted" });
	} catch (err: any) {
		console.error("Error caught in leaseController.ts:", err);
		res.status(400).json({ error: err.message || "Failed to submit lease request" });
	}
};

export const getById = async (req: Request, res: Response) => {
	try {
		const lease = await leasesService.getLeaseById(req.params.id as string);
		if (!lease) return res.status(404).json({ error: "Lease not found" });

		const documents = await leaseDocumentsService.listLeaseDocuments(lease.id);
		res.json({ lease: { ...lease, documents } });
	} catch (err: any) {
    console.error("Error caught in leaseController.ts:", err);
		res.status(500).json({ error: err.message || "Failed to get lease" });
	}
};

export const create = async (req: Request & { user?: { id: string; role: string } }, res: Response) => {
	try {
		const body = createLeaseSchema.parse(req.body);
		const ownerId = req.user?.id;
		if (!ownerId) return res.status(401).json({ error: "Unauthorized" });

		const unit = await propertiesService.getPropertyById(body.unitId);
		if (!unit) return res.status(404).json({ error: "Unit not found" });
		if (unit.type !== "UNIT") return res.status(400).json({ error: "Lease must target a unit" });

		const tenantId = body.tenantId;
		if (!tenantId) return res.status(400).json({ error: "Tenant is required" });

		const lease = await leasesService.createLease({
			propertyId: unit.id,
			tenantId,
			ownerId,
			startDate: new Date(body.startDate),
			endDate: new Date(body.endDate),
			monthlyRent: body.monthlyRent,
			depositAmount: body.depositAmount,
			paidEvery: unit.paidEvery || 1,
			latefee: unit.latefee || 0,
		});

		res.status(201).json({ lease });
	} catch (err: any) {
    console.error("Error caught in leaseController.ts:", err);
		res.status(400).json({ error: err.message || "Failed to create lease" });
	}
};

export const uploadDocument = async (
	req: Request & { user?: { id: string } },
	res: Response
) => {
	try {
		const body = uploadDocSchema.parse(req.body);
		const leaseId = req.params.id as string;

		const doc = await leasesService.addLeaseDocument({
			leaseId,
			fileUrl: body.fileUrl,
			fileName: body.fileName,
			documentType: body.documentType,
			uploadedBy: req.user?.id,
		});

		res.status(201).json({ document: doc });
	} catch (err: any) {
    console.error("Error caught in leaseController.ts:", err);
		res.status(400).json({ error: err.message || "Failed to upload document" });
	}
};

export const downloadDocument = async (req: Request, res: Response) => {
	try {
		const doc = await leaseDocumentsService.getLeaseDocumentById(req.params.id as string);
		if (!doc) return res.status(404).json({ error: "Document not found" });
		res.redirect(doc.fileUrl);
	} catch (err: any) {
    console.error("Error caught in leaseController.ts:", err);
		res.status(500).json({ error: err.message || "Failed to download document" });
	}
};

export const terminate = async (req: Request, res: Response) => {
	try {
		const body = terminateSchema.parse(req.body);
		const lease = await leasesService.terminateLease(req.params.id as string, body.reason);
		res.json({ lease });
	} catch (err: any) {
    console.error("Error caught in leaseController.ts:", err);
		res.status(400).json({ error: err.message || "Failed to terminate lease" });
	}
};

export const moveOutNotice = async (req: Request, res: Response) => {
	try {
		const body = moveOutSchema.parse(req.body);
		const lease = await leasesService.submitMoveOutNotice(
			req.params.id as string,
			new Date(body.noticeDate),
			body.note
		);
		res.json({ lease, message: "Move-out notice submitted" });
	} catch (err: any) {
    console.error("Error caught in leaseController.ts:", err);
		res.status(400).json({ error: err.message || "Failed to submit move-out notice" });
	}
};

export const removeTenant = async (req: Request, res: Response) => {
	try {
		const body = terminateSchema.parse(req.body);
		const lease = await leasesService.terminateLease(req.params.id as string, body.reason);
		res.json({ lease });
	} catch (err: any) {
    console.error("Error caught in leaseController.ts:", err);
		res.status(400).json({ error: err.message || "Failed to remove tenant" });
	}
};

export const decide = async (req: Request & { user?: { id: string; role: string } }, res: Response) => {
	try {
		const body = decisionSchema.parse(req.body);
		const lease = await leasesService.approveLease(req.params.id as string, body.accept);
		res.json({ lease });
	} catch (err: any) {
		console.error("Error caught in leaseController.ts:", err);
		res.status(400).json({ error: err.message || "Failed to update lease request" });
	}
};
