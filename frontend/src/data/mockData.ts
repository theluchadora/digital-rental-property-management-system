import type {
  Property, RentalUnit, Lease, Invoice, MaintenanceRequest, Message, Announcement, Notification, User
} from "@/types/api";

// ===== Mock Property Images =====
export const propertyImages = [
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1515263487990-61b07816b324?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=500&fit=crop",
];

// ===== Mock Users =====
export const mockTenants: User[] = [
  { id: "202bf740-4c3e-4340-975a-60586e9cd071", email: "julian@demo.com", firstName: "Julian", lastName: "Thorne", role: "TENANT", accountStatus: "ACTIVE", createdAt: "2024-03-10T09:00:00Z" },
  { id: "202bf740-4c3e-4340-975a-60586e9cd072", email: "eleanor@demo.com", firstName: "Eleanor", lastName: "Vance", role: "TENANT", accountStatus: "ACTIVE", createdAt: "2022-06-15T09:00:00Z" },
  { id: "202bf740-4c3e-4340-975a-60586e9cd073", email: "marcus@demo.com", firstName: "Marcus", lastName: "Reed", role: "TENANT", accountStatus: "ACTIVE", createdAt: "2023-01-20T09:00:00Z" },
  { id: "202bf740-4c3e-4340-975a-60586e9cd074", email: "sarah@demo.com", firstName: "Sarah", lastName: "Lofton", role: "TENANT", accountStatus: "ACTIVE", createdAt: "2023-06-01T09:00:00Z" },
];

// ===== Mock Properties =====
export const mockProperties: Property[] = [
  {
    id: "prop-001", ownerId: "202bf740-4c3e-4340-975a-60586e9cd070", title: "The Glass Pavilion Residences",
    description: "Premium waterfront residential complex with panoramic ocean views",
    type: "BUILDING", status: "ACTIVE",
    addressCity: "Miami Beach", addressStreet: "822 Ocean Drive", addressSubCity: "South Beach",
    buildingDetails: { buildingType: "APARTMENT", totalFloors: 4, totalUnits: 48, hasParking: true, hasElevator: true, hasSecurity: true, yearBuilt: 2018, amenities: ["Pool", "Gym", "Concierge"] },
    media: [{ id: "m1", propertyId: "prop-001", filePath: propertyImages[0], mediaType: "IMAGE", isPrimary: true }],
    createdAt: "2024-01-15T09:00:00Z",
  },
  {
    id: "prop-002", ownerId: "202bf740-4c3e-4340-975a-60586e9cd070", title: "Vanguard Plaza",
    description: "Modern commercial and residential mixed-use tower",
    type: "BUILDING", status: "ACTIVE",
    addressCity: "San Francisco", addressStreet: "450 Market St", addressSubCity: "Financial District",
    buildingDetails: { buildingType: "COMMERCIAL", totalFloors: 12, totalUnits: 88, hasParking: true, hasElevator: true, hasSecurity: true, yearBuilt: 2020, amenities: ["Rooftop Lounge", "Business Center"] },
    media: [{ id: "m2", propertyId: "prop-002", filePath: propertyImages[1], mediaType: "IMAGE", isPrimary: true }],
    createdAt: "2024-02-20T09:00:00Z",
  },
  {
    id: "prop-003", ownerId: "202bf740-4c3e-4340-975a-60586e9cd070", title: "Marble Arch Lofts",
    description: "Boutique luxury loft conversions in historic district",
    type: "BUILDING", status: "ACTIVE",
    addressCity: "London", addressStreet: "12 Marble Arch Way", addressSubCity: "Mayfair",
    buildingDetails: { buildingType: "APARTMENT", totalFloors: 6, totalUnits: 22, hasParking: false, hasElevator: true, hasSecurity: true, yearBuilt: 2015, amenities: ["Doorman", "Wine Cellar"] },
    media: [{ id: "m3", propertyId: "prop-003", filePath: propertyImages[2], mediaType: "IMAGE", isPrimary: true }],
    createdAt: "2024-03-05T09:00:00Z",
  },
  {
    id: "prop-004", ownerId: "202bf740-4c3e-4340-975a-60586e9cd070", title: "The Sterling Heights",
    description: "Ultra-luxury penthouse residences",
    type: "BUILDING", status: "ACTIVE",
    addressCity: "New York", addressStreet: "1200 Park Ave", addressSubCity: "Lower East Side",
    buildingDetails: { buildingType: "APARTMENT", totalFloors: 8, totalUnits: 24, hasParking: true, hasElevator: true, hasSecurity: true, yearBuilt: 2021, amenities: ["Spa", "Theater"] },
    media: [{ id: "m4", propertyId: "prop-004", filePath: propertyImages[3], mediaType: "IMAGE", isPrimary: true }],
    createdAt: "2024-04-10T09:00:00Z",
  },
  {
    id: "prop-005", ownerId: "202bf740-4c3e-4340-975a-60586e9cd070", title: "Waterfront Lofts",
    description: "Scenic waterfront living with modern amenities",
    type: "BUILDING", status: "ACTIVE",
    addressCity: "Seattle", addressStreet: "Pier 9 Complex", addressSubCity: "Seattle Waterfront",
    buildingDetails: { buildingType: "HOUSE", totalFloors: 5, totalUnits: 36, hasParking: true, hasElevator: true, hasSecurity: false, yearBuilt: 2019, amenities: ["Marina Access", "Kayak Storage"] },
    media: [{ id: "m5", propertyId: "prop-005", filePath: propertyImages[4], mediaType: "IMAGE", isPrimary: true }],
    createdAt: "2024-05-01T09:00:00Z",
  },
  {
    id: "prop-006", ownerId: "202bf740-4c3e-4340-975a-60586e9cd070", title: "North Loop Center",
    description: "Contemporary urban suites in vibrant neighborhood",
    type: "BUILDING", status: "MAINTENANCE",
    addressCity: "Minneapolis", addressStreet: "200 N Loop Blvd", addressSubCity: "North Loop",
    buildingDetails: { buildingType: "APARTMENT", totalFloors: 4, totalUnits: 22, hasParking: true, hasElevator: false, hasSecurity: false, yearBuilt: 2017, amenities: ["Bike Storage", "Dog Park"] },
    media: [{ id: "m6", propertyId: "prop-006", filePath: propertyImages[5], mediaType: "IMAGE", isPrimary: true }],
    createdAt: "2024-06-15T09:00:00Z",
  },
];

// ===== Mock Rental Units =====
export const mockUnits: RentalUnit[] = [
  { id: "unit-001", propertyId: "prop-001", unitIdentifier: "Garden Suite A", bedrooms: 2, bathrooms: 2.5, areaSqMeters: 135, rentAmount: 4250, depositAmount: 4250, status: "VACANT", floorNumber: 1, amenities: ["Balcony", "Walk-in Closet"], property: { id: "prop-001", ownerId: "202bf740-4c3e-4340-975a-60586e9cd070", title: "The Glass Pavilion Residences", addressCity: "Miami Beach", status: "ACTIVE" } },
  { id: "unit-002", propertyId: "prop-001", unitIdentifier: "Garden Suite B", bedrooms: 2, bathrooms: 2, areaSqMeters: 120, rentAmount: 3900, depositAmount: 3900, status: "OCCUPIED", floorNumber: 1, amenities: ["Patio", "Storage"], property: { id: "prop-001", ownerId: "202bf740-4c3e-4340-975a-60586e9cd070", title: "The Glass Pavilion Residences", addressCity: "Miami Beach", status: "ACTIVE" } },
  { id: "unit-003", propertyId: "prop-001", unitIdentifier: "Sky Loft 2A", bedrooms: 1, bathrooms: 1, areaSqMeters: 75, rentAmount: 2800, depositAmount: 2800, status: "MAINTENANCE", floorNumber: 2, amenities: ["City View"], property: { id: "prop-001", ownerId: "202bf740-4c3e-4340-975a-60586e9cd070", title: "The Glass Pavilion Residences", addressCity: "Miami Beach", status: "ACTIVE" } },
  { id: "unit-004", propertyId: "prop-001", unitIdentifier: "Sky Loft 2B", bedrooms: 3, bathrooms: 3, areaSqMeters: 180, rentAmount: 5600, depositAmount: 5600, status: "OCCUPIED", floorNumber: 2, amenities: ["Terrace", "Home Office"], property: { id: "prop-001", ownerId: "202bf740-4c3e-4340-975a-60586e9cd070", title: "The Glass Pavilion Residences", addressCity: "Miami Beach", status: "ACTIVE" } },
  { id: "unit-005", propertyId: "prop-001", unitIdentifier: "Penthouse North", bedrooms: 4, bathrooms: 4.5, areaSqMeters: 280, rentAmount: 12500, depositAmount: 12500, status: "VACANT", floorNumber: 3, amenities: ["Private Pool", "Wine Room", "360° View"], property: { id: "prop-001", ownerId: "202bf740-4c3e-4340-975a-60586e9cd070", title: "The Glass Pavilion Residences", addressCity: "Miami Beach", status: "ACTIVE" } },
  { id: "unit-010", propertyId: "prop-004", unitIdentifier: "Penthouse 4B", bedrooms: 2, bathrooms: 2.5, areaSqMeters: 135, rentAmount: 8250, depositAmount: 12000, status: "VACANT", floorNumber: 4, amenities: ["Terrace", "Concierge"], property: { id: "prop-004", ownerId: "202bf740-4c3e-4340-975a-60586e9cd070", title: "The Sterling Heights", addressCity: "New York", addressStreet: "Financial District", status: "ACTIVE" } },
  { id: "unit-011", propertyId: "prop-002", unitIdentifier: "Unit 1202", bedrooms: 1, bathrooms: 1, areaSqMeters: 83, rentAmount: 5400, depositAmount: 5400, status: "VACANT", floorNumber: 12, amenities: ["City View"], property: { id: "prop-002", ownerId: "202bf740-4c3e-4340-975a-60586e9cd070", title: "Vanguard Plaza", addressCity: "San Francisco", status: "ACTIVE" } },
  { id: "unit-012", propertyId: "prop-005", unitIdentifier: "Suite 9A", bedrooms: 3, bathrooms: 3.5, areaSqMeters: 204, rentAmount: 12900, depositAmount: 25000, status: "VACANT", floorNumber: 9, amenities: ["Private Elevator", "Chef Kitchen"], property: { id: "prop-005", ownerId: "202bf740-4c3e-4340-975a-60586e9cd070", title: "Waterfront Lofts", addressCity: "Seattle", status: "ACTIVE" } },
  { id: "unit-013", propertyId: "prop-003", unitIdentifier: "Loft 203", bedrooms: 2, bathrooms: 2, areaSqMeters: 102, rentAmount: 6800, depositAmount: 10000, status: "VACANT", floorNumber: 2, amenities: ["Exposed Brick", "Original Beams"], property: { id: "prop-003", ownerId: "202bf740-4c3e-4340-975a-60586e9cd070", title: "Marble Arch Lofts", addressCity: "London", status: "ACTIVE" } },
];

// ===== Mock Leases =====
export const mockLeases: Lease[] = [
  {
    id: "lease-001", unitId: "unit-002", tenantId: "202bf740-4c3e-4340-975a-60586e9cd072",
    startDate: "2024-01-01", endDate: "2024-12-31", monthlyRent: 4250, depositAmount: 4250,
    status: "ACTIVE", createdAt: "2023-12-15T09:00:00Z", updatedAt: "2024-01-01T09:00:00Z",
    unit: { id: "unit-002", propertyId: "prop-001", unitIdentifier: "PENTHOUSE-01", bedrooms: 2, bathrooms: 2, rentAmount: 4250, status: "OCCUPIED", property: { id: "prop-001", ownerId: "202bf740-4c3e-4340-975a-60586e9cd070", title: "The Glass Pavilion Residences", addressCity: "Miami Beach", status: "ACTIVE" } },
    tenant: mockTenants[1],
  },
  {
    id: "lease-002", unitId: "unit-004", tenantId: "202bf740-4c3e-4340-975a-60586e9cd071",
    startDate: "2024-03-15", endDate: "2025-03-14", monthlyRent: 2800, depositAmount: 2800,
    status: "DRAFT", createdAt: "2024-03-01T09:00:00Z", updatedAt: "2024-03-10T09:00:00Z",
    unit: { id: "unit-004", propertyId: "prop-001", unitIdentifier: "SUITE-402", bedrooms: 3, bathrooms: 3, rentAmount: 2800, status: "OCCUPIED", property: { id: "prop-001", ownerId: "202bf740-4c3e-4340-975a-60586e9cd070", title: "The Glass Pavilion Residences", addressCity: "Miami Beach", status: "ACTIVE" } },
    tenant: mockTenants[0],
  },
  {
    id: "lease-003", unitId: "unit-003", tenantId: "202bf740-4c3e-4340-975a-60586e9cd073",
    startDate: "2023-01-01", endDate: "2023-12-31", monthlyRent: 2100, depositAmount: 2100,
    status: "EXPIRED", createdAt: "2022-12-15T09:00:00Z", updatedAt: "2024-01-01T09:00:00Z",
    unit: { id: "unit-003", propertyId: "prop-001", unitIdentifier: "UNIT-205", bedrooms: 1, bathrooms: 1, rentAmount: 2100, status: "VACANT", property: { id: "prop-001", ownerId: "202bf740-4c3e-4340-975a-60586e9cd070", title: "The Glass Pavilion Residences", addressCity: "Miami Beach", status: "ACTIVE" } },
    tenant: mockTenants[2],
  },
  {
    id: "lease-004", unitId: "unit-001", tenantId: "202bf740-4c3e-4340-975a-60586e9cd074",
    startDate: "2023-06-01", endDate: "2024-05-31", monthlyRent: 3150, depositAmount: 3150,
    status: "TERMINATED", terminationReason: "Early exit", terminatedAt: "2024-02-15T09:00:00Z",
    createdAt: "2023-05-15T09:00:00Z", updatedAt: "2024-02-15T09:00:00Z",
    unit: { id: "unit-001", propertyId: "prop-001", unitIdentifier: "LOFT-12B", bedrooms: 2, bathrooms: 2.5, rentAmount: 3150, status: "VACANT", property: { id: "prop-001", ownerId: "202bf740-4c3e-4340-975a-60586e9cd070", title: "The Glass Pavilion Residences", addressCity: "Miami Beach", status: "ACTIVE" } },
    tenant: mockTenants[3],
  },
];

// ===== Mock Invoices =====
export const mockInvoices: Invoice[] = [
  { id: "inv-001", leaseId: "lease-001", billingMonth: "2024-08-01", amountDue: 2400, dueDate: "2024-08-01", status: "OVERDUE", createdAt: "2024-07-25T09:00:00Z", updatedAt: "2024-08-02T09:00:00Z" },
  { id: "inv-002", leaseId: "lease-002", billingMonth: "2024-09-01", amountDue: 3150, dueDate: "2024-09-01", status: "PENDING_REVIEW", createdAt: "2024-08-25T09:00:00Z", updatedAt: "2024-09-01T09:00:00Z" },
  { id: "inv-003", leaseId: "lease-003", billingMonth: "2024-07-01", amountDue: 1900, dueDate: "2024-07-01", status: "PAID", createdAt: "2024-06-25T09:00:00Z", updatedAt: "2024-07-05T09:00:00Z" },
  { id: "inv-004", leaseId: "lease-001", billingMonth: "2024-09-01", amountDue: 2800, dueDate: "2024-09-01", status: "UNPAID", createdAt: "2024-08-25T09:00:00Z", updatedAt: "2024-09-01T09:00:00Z" },
  { id: "inv-005", leaseId: "lease-004", billingMonth: "2024-09-01", amountDue: 9300, dueDate: "2024-09-01", status: "PENDING_REVIEW", createdAt: "2024-08-25T09:00:00Z", updatedAt: "2024-09-01T09:00:00Z" },
];

// ===== Mock Maintenance Requests =====
export const mockMaintenanceRequests: MaintenanceRequest[] = [
  {
    id: "maint-001", unitId: "unit-003", tenantId: "202bf740-4c3e-4340-975a-60586e9cd073",
    category: "HVAC", priority: "URGENT", description: "HVAC Failure - Penthouse B. Central cooling system not functioning. Temperature rising above comfortable levels.",
    status: "OPEN",
    createdAt: "2024-10-26T08:30:00Z", updatedAt: "2024-10-26T08:30:00Z",
    unit: { id: "unit-003", propertyId: "prop-004", unitIdentifier: "Penthouse B", bedrooms: 2, bathrooms: 2, rentAmount: 5000, status: "OCCUPIED" },
    tenant: mockTenants[2],
  },
  {
    id: "maint-002", unitId: "unit-002", tenantId: "202bf740-4c3e-4340-975a-60586e9cd072",
    category: "Plumbing", priority: "HIGH", description: "Kitchen Appliance Repair. Dishwasher leaking water onto kitchen floor. Needs immediate attention.",
    status: "IN_PROGRESS",
    createdAt: "2024-10-24T14:00:00Z", updatedAt: "2024-10-25T10:00:00Z",
    unit: { id: "unit-002", propertyId: "prop-003", unitIdentifier: "Suite 402", bedrooms: 2, bathrooms: 2, rentAmount: 3900, status: "OCCUPIED" },
    tenant: mockTenants[1],
  },
  {
    id: "maint-003", unitId: "unit-004", tenantId: "202bf740-4c3e-4340-975a-60586e9cd071",
    category: "Structural", priority: "MEDIUM", description: "Balcony Structural Inspection. Routine request for Unit 404. Noticed minor cracks in balcony railing.",
    status: "OPEN",
    createdAt: "2024-10-23T09:00:00Z", updatedAt: "2024-10-23T09:00:00Z",
    unit: { id: "unit-004", propertyId: "prop-005", unitIdentifier: "Unit 404", bedrooms: 3, bathrooms: 3, rentAmount: 5600, status: "OCCUPIED" },
    tenant: mockTenants[0],
  },
  {
    id: "maint-004", unitId: "unit-001", tenantId: "202bf740-4c3e-4340-975a-60586e9cd074",
    category: "Plumbing", priority: "HIGH", description: "Water Heater Malfunction. Water heater not producing hot water consistently.",
    status: "RESOLVED", resolvedAt: "2024-10-20T16:00:00Z", note: "Replaced thermostat unit",
    createdAt: "2024-10-18T11:00:00Z", updatedAt: "2024-10-20T16:00:00Z",
    unit: { id: "unit-001", propertyId: "prop-001", unitIdentifier: "Unit 101", bedrooms: 2, bathrooms: 2, rentAmount: 4250, status: "VACANT" },
    tenant: mockTenants[3],
  },
];

// ===== Mock Messages =====
export const mockMessages: Message[] = [
  {
    id: "msg-001", senderId: "202bf740-4c3e-4340-975a-60586e9cd072", receiverId: "202bf740-4c3e-4340-975a-60586e9cd070",
    subject: "Terrace Modifications",
    content: "Julian, I've reviewed the proposed modifications for the Penthouse terrace. While the glass structural supports are elegant, I'm concerned about the load-bearing capacity during winter months. Can we confirm the architectural specs again?",
    readAt: "2024-10-26T14:00:00Z", createdAt: "2024-10-26T13:45:00Z", updatedAt: "2024-10-26T13:45:00Z",
    sender: { id: "202bf740-4c3e-4340-975a-60586e9cd072", email: "arthur@demo.com", firstName: "Arthur", lastName: "Sterling", role: "TENANT", accountStatus: "ACTIVE", createdAt: "2022-06-15T09:00:00Z" },
  },
  {
    id: "msg-002", senderId: "202bf740-4c3e-4340-975a-60586e9cd070", receiverId: "202bf740-4c3e-4340-975a-60586e9cd072",
    subject: "Re: Terrace Modifications",
    content: "Absolutely, Arthur. The structural engineer has already run the simulations for up to 250kg/sqm of snow load. I'll attach the technical report for your review. We've used reinforced titanium-boron alloy for the primary joints.",
    readAt: "2024-10-26T14:10:00Z", createdAt: "2024-10-26T14:05:00Z", updatedAt: "2024-10-26T14:05:00Z",
    sender: { id: "202bf740-4c3e-4340-975a-60586e9cd070", email: "julian@demo.com", firstName: "Julian", lastName: "Thorne", role: "OWNER", accountStatus: "ACTIVE", createdAt: "2024-01-15T09:00:00Z" },
  },
  {
    id: "msg-003", senderId: "202bf740-4c3e-4340-975a-60586e9cd072", receiverId: "202bf740-4c3e-4340-975a-60586e9cd070",
    subject: "Re: Terrace Modifications",
    content: "The architectural revisions for the terrace look promising. If the specs hold, let's proceed with the procurement of the glass panels by end of week.",
    readAt: null, createdAt: "2024-10-26T14:20:00Z", updatedAt: "2024-10-26T14:20:00Z",
    sender: { id: "202bf740-4c3e-4340-975a-60586e9cd072", email: "arthur@demo.com", firstName: "Arthur", lastName: "Sterling", role: "TENANT", accountStatus: "ACTIVE", createdAt: "2022-06-15T09:00:00Z" },
  },
];

export const mockConversations = [
  { id: "conv-001", user: { id: "202bf740-4c3e-4340-975a-60586e9cd072", firstName: "Arthur", lastName: "Sterling", role: "TENANT" as const }, property: "THE HEIGHTS - PENTHOUSE B", lastMessage: "The architectural revisions for the terrace look...", time: "14:20", unread: true },
  { id: "conv-002", user: { id: "202bf740-4c3e-4340-975a-60586e9cd073", firstName: "Elena", lastName: "Vance", role: "TENANT" as const }, property: "ST. GEORGE PLAZA", lastMessage: "Please confirm the receipt of the monthly ledg...", time: "Yesterday", unread: false },
  { id: "conv-003", user: { id: "202bf740-4c3e-4340-975a-60586e9cd074", firstName: "Marcus", lastName: "Reed", role: "TENANT" as const }, property: "VILLA MARIPOSA", lastMessage: "The landscape architect has completed the init...", time: "Oct 24", unread: false },
];

// ===== Mock Announcements =====
export const mockAnnouncements: Announcement[] = [
  { id: "ann-001", ownerId: "202bf740-4c3e-4340-975a-60586e9cd070", propertyId: "prop-001", title: "Scheduled Maintenance", content: "Water supply will be temporarily interrupted on Nov 1st from 10 AM to 2 PM for pipe maintenance.", createdAt: "2024-10-25T09:00:00Z", updatedAt: "2024-10-25T09:00:00Z" },
  { id: "ann-002", ownerId: "202bf740-4c3e-4340-975a-60586e9cd070", title: "Holiday Hours", content: "The management office will have reduced hours during the holiday season. Please plan accordingly.", createdAt: "2024-10-20T09:00:00Z", updatedAt: "2024-10-20T09:00:00Z" },
];

// ===== Mock Notifications =====
export const mockNotifications: Notification[] = [
  { id: "notif-001", userId: "202bf740-4c3e-4340-975a-60586e9cd070", type: "INVOICE", message: "Payment of $4,250 received for Unit 402B via Wire.", isRead: false, createdAt: "2024-10-26T09:28:00Z", updatedAt: "2024-10-26T09:28:00Z" },
  { id: "notif-002", userId: "202bf740-4c3e-4340-975a-60586e9cd070", type: "MAINTENANCE", message: "Water heater malfunction reported at The Sterling.", isRead: false, createdAt: "2024-10-26T07:42:00Z", updatedAt: "2024-10-26T07:42:00Z" },
  { id: "notif-003", userId: "202bf740-4c3e-4340-975a-60586e9cd070", type: "SYSTEM", message: "New Lease Executed: Sarah J. signed for Vanguard Plaza, Suite 12.", isRead: true, createdAt: "2024-10-26T04:42:00Z", updatedAt: "2024-10-26T04:42:00Z" },
];
