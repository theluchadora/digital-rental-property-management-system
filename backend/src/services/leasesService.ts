import * as leasesRepo from "../repositories/leasesRepository";
import * as notificationsService from "./notificationsService";
import * as invoicesService from "./invoicesService";
import * as propertiesService from "./propertiesService";
import { NotificationType } from "@prisma/client";
import { stat } from "node:fs";



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
      await leasesRepo.updateLease(leaseId, { status: "TERMINATED" });
      await propertiesService.updateProperty(lease.propertyId, { status: "VACANT" });

      // Notify tenant that lease has been rejected
      await notificationsService.createNotification({
        userId: lease.tenantId,
        type: NotificationType.LEASE,
        title: "Your lease has been rejected",
        content: `Your lease for property ${lease.propertyId} has been rejected.`,
        leaseId: lease.id,
      });
    } else{
// approved by the owner, now we set lease to awaiting payment and generate initial invoice for the lease

            const monthlyRent = Number(lease.monthlyRent);

            const property = await propertiesService.getPropertyById(lease.propertyId);
            if (!property) throw new Error("Property not found");
            
            await leasesRepo.updateLease(leaseId, { status: "AWAITINGPAYMENT" });
            // Notify tenant of new lease
            await notificationsService.createNotification({
            userId: lease.tenantId,
            type: NotificationType.LEASE,
            title: "New Lease Created",
            content: `A new lease has been created for property ${property.title}.`,
            leaseId: leaseId,


        });


        // Create initial invoice for the lease
        await invoicesService.createInvoice({
            leaseId: lease.id,
            billingMonth: new Date(),
            amountDue: monthlyRent * lease.paidEvery,
            dueDate: new Date(new Date().setDate(new Date().getDate() + 7)), // Due in 7 days
            lineItems: [
            {
                description: "Monthly Rent",
                amount: monthlyRent,
            },
            ],
        });


        return lease;

    }

   
};

//by the tenant first rentnow button
export const initiateLease = async (propertyId: string , tenantId: string) => {
    const property = await propertiesService.getPropertyById(propertyId);
     
    if (!property) throw new Error("Property not found");
    if (property.monthlyRent == null) throw new Error("Property monthly rent not set");
    if (property.status !== "VACANT") throw new Error("Property is not vacant");

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
   
  await propertiesService.updateProperty(propertyId, { status: "OCCUPIED" }); // Set property status to pending until lease is approved

  await notificationsService.createNotification({
    userId: property.ownerId,
    type: NotificationType.LEASE,
    title: "New Lease Created",
    content: `Waiting for approval: A new lease has been created for property ${property.title}.`,
    leaseId: lease.id,

  });

}


