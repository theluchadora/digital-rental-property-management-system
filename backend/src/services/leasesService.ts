import * as leasesRepo from "../repositories/leasesRepository";
import * as notificationsService from "./notificationsService";
import * as invoicesService from "./invoicesService";
import * as propertiesService from "./propertiesService";
import * as announcementsService from "./announcementsService";
import * as invoiceRepo from "../repositories/invoicesRepository";
import { propertyHasBlockingLease } from "./propertyAvailability";
import { NotificationType } from "@prisma/client";
import * as leaseDocumentsService from "./leaseDocumentsService";



/// needs some logic

// export const endLease = async (leaseId: string,): Promise<void> => {
//   const lease = await leasesRepo.getLeaseById(leaseId);
//   if (!lease) throw new Error("Lease not found");


//   await leasesRepo.updateLease(leaseId, { isActive: false });

//   // Notify tenant that lease has ended
//   await notificationsService.createNotification({
//     userId: lease.tenantId,
//     type: NotificationType.LEASE,
//     title: "Your lease has ended",
//     content: `Your lease for property ${lease.propertyId} has ended.`,
//     leaseId: lease.id,
//   });
// };

export const getLeaseById = async (id: string) => {
  return await leasesRepo.getLeaseById(id);
};

export const getLeasesByTenantId = async (tenantId: string) => {
  return await leasesRepo.getLeasesByTenantId(tenantId);
};

export const getLeasesByOwnerId = async (ownerId: string) => {
  return await leasesRepo.getLeasesByOwnerId(ownerId);
};

export const createLease = async (input: {
  propertyId: string;
  tenantId: string;
  ownerId: string;
  startDate: Date;
  endDate: Date;
  monthlyRent: number;
  depositAmount?: number;
  paidEvery: number;
  latefee: number;
}) => {
  const lease = await leasesRepo.createLease({
    propertyId: input.propertyId,
    tenantId: input.tenantId,
    ownerId: input.ownerId,
    startDate: input.startDate,
    endDate: input.endDate,
    monthlyRent: input.monthlyRent as any,
    depositAmount: input.depositAmount as any,
    paidEvery: input.paidEvery,
    latefee: input.latefee,
    status: "DRAFT",
    moveInDate: input.startDate,
    moveOutDate: input.endDate,
  } as any);

  await notificationsService.createNotification({
    userId: input.tenantId,
    type: NotificationType.LEASE,
    title: "Lease created",
    content: "A lease has been drafted and awaits signature.",
    leaseId: lease.id,
  });

  return lease;
};

export const addLeaseDocument = async (input: {
  leaseId: string;
  fileUrl: string;
  fileName?: string;
  documentType?: string;
  uploadedBy?: string;
}) => {
  const doc = await leaseDocumentsService.addLeaseDocument(input);
  const lease = await leasesRepo.getLeaseById(input.leaseId);
  if (lease && lease.status === "DRAFT") {
    await leasesRepo.updateLease(input.leaseId, { status: "ACTIVE" });
  }
  return doc;
};

/** Tenant withdraws application before payment (INITIATED or AWAITINGPAYMENT). */
export const cancelApplication = async (leaseId: string, tenantId: string) => {
  const lease = await leasesRepo.getLeaseById(leaseId);
  if (!lease) throw new Error("Lease not found");
  if (lease.tenantId !== tenantId) throw new Error("Not authorized to cancel this application");
  if (!["INITIATED", "AWAITINGPAYMENT"].includes(lease.status)) {
    throw new Error("Only pending applications can be cancelled");
  }

  const property = await propertiesService.getPropertyById(lease.propertyId);

  const updated = await leasesRepo.updateLease(leaseId, {
    status: "TERMINATED",
    terminationReason: "Cancelled by tenant",
    terminatedAt: new Date(),
  } as any);

  await propertiesService.updateProperty(lease.propertyId, { status: "VACANT" });

  const invoices = (lease as { invoices?: { id: string; status: string }[] }).invoices ?? [];
  await Promise.all(
    invoices
      .filter((inv) => inv.status === "UNPAID" || inv.status === "OVERDUE")
      .map((inv) => invoiceRepo.updateInvoice(inv.id, { status: "VOID" } as any))
  );

  await notificationsService.createNotification({
    userId: lease.ownerId,
    type: NotificationType.LEASE,
    title: "Application cancelled",
    content: property
      ? `The tenant cancelled their application for ${property.title}.`
      : "A tenant cancelled their rental application.",
    leaseId: lease.id,
  });

  return updated;
};

export const terminateLease = async (
  leaseId: string,
  reason: string
) => {
  const lease = await leasesRepo.getLeaseById(leaseId);
  if (!lease) throw new Error("Lease not found");

  const updated = await leasesRepo.updateLease(leaseId, {
    status: "TERMINATED",
    terminationReason: reason,
    terminatedAt: new Date(),
  } as any);

  await propertiesService.updateProperty(lease.propertyId, { status: "VACANT" });

  await notificationsService.createNotification({
    userId: lease.tenantId,
    type: NotificationType.LEASE,
    title: "Lease terminated",
    content: reason,
    leaseId: lease.id,
  });

  return updated;
};

export const submitMoveOutNotice = async (
  leaseId: string,
  noticeDate: Date,
  note?: string
) => {
  const updated = await leasesRepo.updateLease(leaseId, {
    moveOutNoticeDate: noticeDate,
    moveOutNoticeNote: note,
  } as any);

  await notificationsService.createNotification({
    userId: updated.ownerId,
    type: NotificationType.LEASE,
    title: "Move-out notice",
    content: "Tenant submitted a move-out notice.",
    leaseId: updated.id,
  });

  return updated;
};

export const startLeaseAgreement = async (
  leaseId: string
): Promise<void> => {
  const lease = await leasesRepo.getLeaseById(leaseId);
  if (!lease) throw new Error("Lease not found");

  await leasesRepo.updateLease(leaseId, { status: "ACTIVE" });

  // Notify tenant that lease has started
  await notificationsService.createNotification({
    userId: lease.tenantId,
    type: NotificationType.LEASE,
    title: "Your lease has started",
    content: `Your lease for property ${lease.propertyId} has started.`,
    leaseId: lease.id,
  });
};

export const approveLease = async (leaseId: string , verdict: boolean) => {
    
    const lease = await leasesRepo.getLeaseById(leaseId);
    if (!lease) throw new Error("Lease not found");

    if (!verdict) {
      const updated = await leasesRepo.updateLease(leaseId, { status: "TERMINATED" });
      await propertiesService.updateProperty(lease.propertyId, { status: "VACANT" });

      // Notify tenant that lease has been rejected
      await notificationsService.createNotification({
        userId: lease.tenantId,
        type: NotificationType.LEASE,
        title: "Your lease has been rejected",
        content: `Your lease for property ${lease.propertyId} has been rejected.`,
        leaseId: lease.id,
      });

      return updated;
    } else{
// approved by the owner, now we set lease to awaiting payment and generate initial invoice for the lease

            const monthlyRent = Number(lease.monthlyRent);

            const property = await propertiesService.getPropertyById(lease.propertyId);
            if (!property) throw new Error("Property not found");
            
            const updated = await leasesRepo.updateLease(leaseId, { status: "AWAITINGPAYMENT" });
            // Notify tenant of new lease
            await notificationsService.createNotification({
            userId: lease.tenantId,
            type: NotificationType.LEASE,
            title: "Lease approved",
            content: `Your lease for ${property.title} is approved. Please complete payment to confirm.`,
            leaseId: leaseId,


        });


        const invoice = await invoicesService.createInvoice({
            leaseId: lease.id,
            billingMonth: new Date(),
            amountDue: monthlyRent * lease.paidEvery,
            dueDate: new Date(new Date().setDate(new Date().getDate() + 7)),
            lineItems: [
            {
                description: "Monthly Rent",
                amount: monthlyRent,
            },
            ],
        });

        await announcementsService.createSystemAnnouncement({
          ownerId: lease.ownerId,
          propertyId: lease.propertyId,
          leaseId: lease.id,
          invoiceId: invoice.id,
          title: "Lease approved — payment required",
          content: `Your application for ${property.title} was approved. Pay ${monthlyRent * lease.paidEvery} ETB to confirm your lease.`,
          notifyUserId: lease.tenantId,
        });

        return updated;

    }

   
};

//by the tenant first rentnow button
export const initiateLease = async (propertyId: string , tenantId: string) => {
    const property = await propertiesService.getPropertyById(propertyId);
     
    if (!property) throw new Error("Property not found");
    if (property.monthlyRent == null) throw new Error("Property monthly rent not set");
    if (property.status !== "VACANT") throw new Error("Property is not available");
    if (await propertyHasBlockingLease(propertyId)) {
      throw new Error("This property already has a pending or active lease");
    }

    const existingLeases = await leasesRepo.getLeasesByTenantId(tenantId);
    const hasActiveOrPending = existingLeases.some(
      l => l.propertyId === propertyId && ["INITIATED", "AWAITINGPAYMENT", "ACTIVE"].includes(l.status)
    );
    if (hasActiveOrPending) {
       throw new Error("You have already applied for this property");
    }

    const monthlyRent = Number(property.monthlyRent);


    const lease = await leasesRepo.createLease({
    propertyId : propertyId,
    tenantId: tenantId, // For demo purposes, we set tenant as owner. In real app, tenant would be selected separately.
    ownerId: property.ownerId,
    startDate: new Date(),
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + property.minLeaseMonth)), // 1 year lease
    paidEvery: property.paidEvery,
    monthlyRent: monthlyRent,
    status: "INITIATED",
    latefee: property.latefee,
    moveInDate: new Date(),
    moveOutDate: null,
    updatedAt: new Date(),
  } as any);

  await propertiesService.updateProperty(propertyId, { status: "OCCUPIED" });

  await notificationsService.createNotification({
    userId: property.ownerId,
    type: NotificationType.LEASE,
    title: "New rental application",
    content: `A tenant applied for ${property.title}. Review and accept or decline the application.`,
    leaseId: lease.id,
  });

  const estimatedDue = monthlyRent * (property.paidEvery ?? lease.paidEvery ?? 1);
  await announcementsService.createSystemAnnouncement({
    ownerId: property.ownerId,
    propertyId: propertyId,
    leaseId: lease.id,
    title: "Pending application — review required",
    content: `New application for ${property.title}. Estimated first payment: ${estimatedDue} ETB. Open the lease to accept or decline.`,
    notifyUserId: property.ownerId,
    notificationType: NotificationType.LEASE,
  });
}


