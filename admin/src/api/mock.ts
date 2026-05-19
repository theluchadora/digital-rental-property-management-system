import type {
  User,
  Property,
  Lease,
  Invoice,
  MaintenanceRequest,
  Message,
  Notification,
  AdminStats,
  RentalUnitSummary,
  PropertySummary,
} from "./types";

// Mock data so the admin panel is fully usable without a live backend.
const uid = (n: number, p = "id") => `${p}-${n.toString().padStart(4, "0")}`;
const isoDaysAgo = (d: number) =>
  new Date(Date.now() - d * 86400000).toISOString();

const firstNames = [
  "Alex",
  "Sara",
  "Liam",
  "Maya",
  "Noah",
  "Lina",
  "Yusuf",
  "Hana",
  "Daniel",
  "Sofia",
  "Ethan",
  "Aisha",
  "Marcus",
  "Zara",
  "Omar",
  "Iris",
];
const lastNames = [
  "Bekele",
  "Tesfaye",
  "Hassan",
  "Worku",
  "Abebe",
  "Demissie",
  "Kebede",
  "Lemma",
  "Mengistu",
  "Tadesse",
  "Yohannes",
  "Girma",
];
const cities = [
  "Addis Ababa",
  "Bahir Dar",
  "Hawassa",
  "Mekelle",
  "Adama",
  "Dire Dawa",
];
const streets = [
  "Bole Rd",
  "Africa Ave",
  "Churchill Ave",
  "Meskel Sq",
  "Kazanchis",
  "Piazza",
  "Sarbet",
];
const titles = [
  "Sunset Apartments",
  "Lakeview Villas",
  "Downtown Lofts",
  "Garden Residences",
  "Skyline Towers",
  "Riverside Suites",
  "Heritage Plaza",
  "Olive Court",
];

const rand = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

function makeUsers(): User[] {
  const users: User[] = [
    {
      id: uid(1, "user"),
      email: "admin@example.com",
      firstName: "Admin",
      lastName: "User",
      phoneNumber: "+251911000001",
      role: "ADMIN",
      accountStatus: "ACTIVE",
      createdAt: isoDaysAgo(365),
      updatedAt: isoDaysAgo(1),
    },
  ];
  for (let i = 2; i <= 26; i++) {
    const role = i % 4 === 0 ? "OWNER" : "TENANT";
    users.push({
      id: uid(i, "user"),
      email: `${firstNames[i % firstNames.length].toLowerCase()}.${lastNames[i % lastNames.length].toLowerCase()}${i}@example.com`,
      firstName: firstNames[i % firstNames.length],
      lastName: lastNames[i % lastNames.length],
      phoneNumber: `+25191${(1000000 + i).toString()}`,
      role,
      accountStatus:
        i % 11 === 0 ? "SUSPENDED" : i % 7 === 0 ? "INACTIVE" : "ACTIVE",
      createdAt: isoDaysAgo(300 - i * 8),
      updatedAt: isoDaysAgo(i),
    });
  }
  return users;
}

const USERS = makeUsers();

function makeProperties(): Property[] {
  const owners = USERS.filter((u) => u.role === "OWNER");
  return Array.from({ length: 14 }).map((_, i) => {
    const owner = owners[i % owners.length];
    return {
      id: uid(i + 1, "prop"),
      ownerId: owner.id,
      title: `${titles[i % titles.length]} ${i + 1}`,
      description: "Modern, well-located property with great amenities.",
      type: i % 7 === 0 ? "VEHICLE" : "BUILDING",
      addressCity: cities[i % cities.length],
      addressStreet: streets[i % streets.length],
      status: i % 9 === 0 ? "MAINTENANCE" : "ACTIVE",
      createdAt: isoDaysAgo(200 - i * 5),
      updatedAt: isoDaysAgo(i),
      owner,
    };
  });
}

const PROPERTIES = makeProperties();

function makeUnits(): RentalUnitSummary[] {
  const out: RentalUnitSummary[] = [];
  PROPERTIES.forEach((p, idx) => {
    const count = 2 + (idx % 3);
    for (let i = 0; i < count; i++) {
      const propSummary: PropertySummary = {
        id: p.id,
        ownerId: p.ownerId,
        title: p.title,
        addressCity: p.addressCity,
        addressStreet: p.addressStreet,
        status: p.status,
      };
      out.push({
        id: `${p.id}-u${i}`,
        propertyId: p.id,
        unitIdentifier: `Unit ${String.fromCharCode(65 + i)}${idx + 1}`,
        bedrooms: 1 + (i % 4),
        bathrooms: 1 + (i % 2),
        areaSqMeters: 60 + i * 15,
        rentAmount: 8000 + idx * 500 + i * 1000,
        depositAmount: 16000 + idx * 1000,
        status: i % 3 === 0 ? "VACANT" : "OCCUPIED",
        description: null,
        floorNumber: i + 1,
        amenities: ["Wi-Fi", "Parking"],
        property: propSummary,
      });
    }
  });
  return out;
}

const UNITS = makeUnits();
const tenants = USERS.filter((u) => u.role === "TENANT");

function makeLeases(): Lease[] {
  return UNITS.filter((u) => u.status === "OCCUPIED").map((unit, i) => {
    const tenant = tenants[i % tenants.length];
    return {
      id: uid(i + 1, "lease"),
      unitId: unit.id,
      tenantId: tenant.id,
      startDate: isoDaysAgo(180 - i * 3).slice(0, 10),
      endDate: isoDaysAgo(-180 + i * 3).slice(0, 10),
      monthlyRent: unit.rentAmount,
      depositAmount: unit.depositAmount ?? unit.rentAmount * 2,
      status: i % 11 === 0 ? "TERMINATED" : i % 13 === 0 ? "EXPIRED" : "ACTIVE",
      createdAt: isoDaysAgo(180 - i * 3),
      updatedAt: isoDaysAgo(i),
      unit,
      tenant,
      documents: [],
    };
  });
}

const LEASES = makeLeases();

function makeInvoices(): Invoice[] {
  const out: Invoice[] = [];
  LEASES.forEach((lease, li) => {
    for (let m = 0; m < 4; m++) {
      const status = m === 0 ? "UNPAID" : m === 1 ? "PENDING_REVIEW" : "PAID";
      out.push({
        id: `inv-${li}-${m}`,
        leaseId: lease.id,
        billingMonth: isoDaysAgo(m * 30).slice(0, 10),
        amountDue: lease.monthlyRent,
        dueDate: isoDaysAgo(m * 30 - 5).slice(0, 10),
        status,
        createdAt: isoDaysAgo(m * 30),
        updatedAt: isoDaysAgo(m * 30 - 1),
        lease,
        receipts: [],
      });
    }
  });
  return out;
}

const INVOICES = makeInvoices();

function makeMaintenance(): MaintenanceRequest[] {
  const cats = ["Plumbing", "Electrical", "HVAC", "Appliance", "Structural"];
  const prios: MaintenanceRequest["priority"][] = [
    "LOW",
    "MEDIUM",
    "HIGH",
    "URGENT",
  ];
  const stats: MaintenanceRequest["status"][] = [
    "OPEN",
    "IN_PROGRESS",
    "RESOLVED",
    "REJECTED",
  ];
  return Array.from({ length: 18 }).map((_, i) => {
    const lease = LEASES[i % LEASES.length];
    return {
      id: uid(i + 1, "mnt"),
      unitId: lease.unitId,
      tenantId: lease.tenantId,
      category: cats[i % cats.length],
      priority: prios[i % prios.length],
      description: "Reported issue requiring inspection and repair.",
      status: stats[i % stats.length],
      createdAt: isoDaysAgo(40 - i),
      updatedAt: isoDaysAgo(i % 10),
      unit: lease.unit,
      tenant: lease.tenant,
      evidence: [],
    };
  });
}

const MAINTENANCE = makeMaintenance();

function makeMessages(): Message[] {
  return Array.from({ length: 24 }).map((_, i) => {
    const sender = USERS[(i + 2) % USERS.length];
    const receiver = USERS[(i + 5) % USERS.length];
    return {
      id: uid(i + 1, "msg"),
      senderId: sender.id,
      receiverId: receiver.id,
      subject: [
        "Question about lease",
        "Rent receipt",
        "Maintenance follow-up",
        "General inquiry",
      ][i % 4],
      content:
        "Hello, I wanted to follow up regarding the matter we discussed earlier. Please let me know.",
      readAt: i % 3 === 0 ? null : isoDaysAgo(i % 5),
      createdAt: isoDaysAgo(i),
      updatedAt: isoDaysAgo(i),
      sender,
      receiver,
    };
  });
}

const MESSAGES = makeMessages();

function makeNotifications(): Notification[] {
  const types: Notification["type"][] = [
    "MESSAGE",
    "ANNOUNCEMENT",
    "MAINTENANCE",
    "INVOICE",
    "SYSTEM",
  ];
  return Array.from({ length: 30 }).map((_, i) => {
    const u = USERS[(i + 3) % USERS.length];
    return {
      id: uid(i + 1, "ntf"),
      userId: u.id,
      type: types[i % types.length],
      message: [
        "New maintenance request submitted (URGENT)",
        "Help requested by tenant",
        "Incident reported at property",
        "Invoice has been paid",
        "New message received",
      ][i % 5],
      entityType: null,
      entityId: null,
      isRead: i % 3 === 0,
      createdAt: isoDaysAgo(i),
      updatedAt: isoDaysAgo(i),
      user: u,
    };
  });
}

const NOTIFICATIONS = makeNotifications();

export const mockDb = {
  users: USERS,
  properties: PROPERTIES,
  units: UNITS,
  leases: LEASES,
  invoices: INVOICES,
  maintenance: MAINTENANCE,
  messages: MESSAGES,
  notifications: NOTIFICATIONS,
};

export function buildStats(): AdminStats {
  const owners = USERS.filter((u) => u.role === "OWNER").length;
  const tenantCount = USERS.filter((u) => u.role === "TENANT").length;
  const totalRevenue = INVOICES.filter((i) => i.status === "PAID").reduce(
    (s, i) => s + i.amountDue,
    0,
  );
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const monthlyRevenue = months.map((m, idx) => ({
    month: m,
    revenue: Math.round(totalRevenue / 6 + Math.sin(idx) * 5000 + idx * 1500),
  }));
  return {
    totalUsers: USERS.length,
    totalOwners: owners,
    totalTenants: tenantCount,
    totalProperties: PROPERTIES.length,
    totalLeases: LEASES.length,
    activeLeases: LEASES.filter((l) => l.status === "ACTIVE").length,
    totalRevenue,
    pendingInvoices: INVOICES.filter(
      (i) => i.status === "PENDING_REVIEW" || i.status === "UNPAID",
    ).length,
    openMaintenance: MAINTENANCE.filter(
      (m) => m.status === "OPEN" || m.status === "IN_PROGRESS",
    ).length,
    unreadNotifications: NOTIFICATIONS.filter((n) => !n.isRead).length,
    monthlyRevenue,
    usersByRole: [
      { role: "Admins", count: USERS.filter((u) => u.role === "ADMIN").length },
      { role: "Owners", count: owners },
      { role: "Tenants", count: tenantCount },
    ],
    maintenanceByStatus: ["OPEN", "IN_PROGRESS", "RESOLVED", "REJECTED"].map(
      (s) => ({
        status: s,
        count: MAINTENANCE.filter((m) => m.status === s).length,
      }),
    ),
  };
}

export function removeUser(id: string) {
  const idx = USERS.findIndex((u) => u.id === id);
  if (idx >= 0) USERS.splice(idx, 1);
}
