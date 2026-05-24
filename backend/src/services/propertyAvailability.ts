import prisma from "../config/db";

export const BLOCKING_LEASE_STATUSES = ["INITIATED", "AWAITINGPAYMENT", "ACTIVE"] as const;

export async function getPropertyIdsWithBlockingLeases(): Promise<Set<string>> {
  const rows = await prisma.lease.findMany({
    where: { status: { in: [...BLOCKING_LEASE_STATUSES] } },
    select: { propertyId: true },
  });
  return new Set(rows.map((r) => r.propertyId));
}

export async function propertyHasBlockingLease(propertyId: string): Promise<boolean> {
  const count = await prisma.lease.count({
    where: {
      propertyId,
      status: { in: [...BLOCKING_LEASE_STATUSES] },
    },
  });
  return count > 0;
}

export function isAvailableForPublicListing(
  property: { id: string; status: string },
  blockedIds: Set<string>
): boolean {
  return property.status === "VACANT" && !blockedIds.has(property.id);
}
