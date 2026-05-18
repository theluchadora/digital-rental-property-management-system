const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "RPMS API",
    version: "1.0.0",
    description: "API documentation for the RPMS project",
  },
  servers: [{ url: "/api" }],
  tags: [
    { name: "Users", description: "User management endpoints" },
    { name: "Properties", description: "Property and photo endpoints" },
    { name: "Notifications", description: "Notification endpoints" }
  ],
  components: {
    schemas: {
      UserRole: {
        type: "string",
        enum: ["TENANT", "OWNER", "ADMIN"],
      },
      PropertyType: {
        type: "string",
        enum: ["BUILDING", "UNIT", "HOUSE", "VEHICLE"]
      },
      PropertyStatus: {
        type: "string",
        enum: ["VACANT", "OCCUPIED", "MAINTENANCE"]
      },
      FuelType: {
        type: "string",
        enum: ["PETROL", "DIESEL", "ELECTRIC", "HYBRID"]
      },
      NotificationType: {
        type: "string",
        enum: ["INVOICE", "MAINTENANCE", "MESSAGE", "SYSTEM", "LEASE"]
      },
      Notification: {
        type: "object",
        properties: {
          id: { type: "string" },
          userId: { type: "string" },
          type: { $ref: "#/components/schemas/NotificationType" },
          title: { type: "string" },
          content: { type: "string" },
          isRead: { type: "boolean" },
          readAt: { type: "string", format: "date-time", nullable: true },
          invoiceId: { type: "string", nullable: true },
          leaseId: { type: "string", nullable: true },
          messageId: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" }
        },
        required: ["id", "userId", "type", "title", "content", "isRead", "createdAt"]
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          email: { type: "string", format: "email" },
          firstName: { type: "string" },
          middleName: { type: "string", nullable: true },
          lastName: { type: "string" },
          phoneNumber: { type: "string", nullable: true },
          profileImageUrl: { type: "string", nullable: true },
          role: { $ref: "#/components/schemas/UserRole" },
          isActive: { type: "boolean" },
          lastLoginAt: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        },
        required: ["id", "email", "firstName", "lastName", "role", "isActive", "createdAt", "updatedAt"]
      },
      UserCreateInput: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
          firstName: { type: "string" },
          middleName: { type: "string" },
          lastName: { type: "string" },
          phoneNumber: { type: "string" },
          profileImageUrl: { type: "string" },
          role: { $ref: "#/components/schemas/UserRole" }
        },
        required: ["email", "password", "firstName", "lastName"]
      },
      UserUpdateInput: {
        type: "object",
        properties: {
          firstName: { type: "string" },
          lastName: { type: "string" },
          phoneNumber: { type: "string" },
          profileImageUrl: { type: "string" },
          isActive: { type: "boolean" },
          lastLoginAt: { type: "string", format: "date-time" }
        }
      },
      LoginRequest: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" }
        },
        required: ["email", "password"]
      },
      LoginResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
          user: { $ref: "#/components/schemas/User" }
        }
      }
      ,
      Property: {
        type: "object",
        properties: {
          id: { type: "string" },
          ownerId: { type: "string" },
          title: { type: "string" },
          description: { type: "string", nullable: true },
          type: { $ref: "#/components/schemas/PropertyType" },
          status: { $ref: "#/components/schemas/PropertyStatus" },
          hasUnits: { type: "boolean" },
          parentId: { type: "string", nullable: true },
          address: { type: "string", nullable: true },
          city: { type: "string", nullable: true },
          state: { type: "string", nullable: true },
          zipCode: { type: "string", nullable: true },
          unitNumber: { type: "string", nullable: true },
          floorNumber: { type: "integer", nullable: true },
          bedrooms: { type: "integer", nullable: true },
          bathrooms: { type: "number", nullable: true },
          squareFeet: { type: "integer", nullable: true },
          hasGarage: { type: "boolean" },
          hasGarden: { type: "boolean" },
          totalUnits: { type: "integer", nullable: true },
          hasElevator: { type: "boolean" },
          hasParking: { type: "boolean" },
          hasGym: { type: "boolean" },
          hasPool: { type: "boolean" },
          hasSecurity: { type: "boolean" },
          yearBuilt: { type: "integer", nullable: true },
          plateNumber: { type: "string", nullable: true },
          brand: { type: "string", nullable: true },
          model: { type: "string", nullable: true },
          year: { type: "integer", nullable: true },
          color: { type: "string", nullable: true },
          mileage: { type: "integer", nullable: true },
          fuelType: { $ref: "#/components/schemas/FuelType" },
          seats: { type: "integer", nullable: true },
          monthlyRent: { type: "number", nullable: true },
          paidEvery: { type: "integer", nullable: true },
          minLeaseMonth: { type: "integer" },
          latefee: { type: "integer" },
          features: { type: "object", nullable: true },
          rules: { type: "string", nullable: true },
          notes: { type: "string", nullable: true },
          photos: { type: "array", items: { $ref: "#/components/schemas/PropertyPhoto" } },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },
      PropertyPhoto: {
        type: "object",
        properties: {
          id: { type: "string" },
          propertyId: { type: "string" },
          url: { type: "string", format: "uri" },
          uploadedAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },
      PropertyCreateInput: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          type: { $ref: "#/components/schemas/PropertyType" },
          status: { $ref: "#/components/schemas/PropertyStatus" },
          hasUnits: { type: "boolean" },
          parentId: { type: "string" },
          address: { type: "string" },
          city: { type: "string" },
          state: { type: "string" },
          zipCode: { type: "string" },
          unitNumber: { type: "string" },
          floorNumber: { type: "integer" },
          bedrooms: { type: "integer" },
          bathrooms: { type: "number" },
          squareFeet: { type: "integer" },
          hasGarage: { type: "boolean" },
          hasGarden: { type: "boolean" },
          totalUnits: { type: "integer" },
          hasElevator: { type: "boolean" },
          hasParking: { type: "boolean" },
          hasGym: { type: "boolean" },
          hasPool: { type: "boolean" },
          hasSecurity: { type: "boolean" },
          yearBuilt: { type: "integer" },
          plateNumber: { type: "string" },
          brand: { type: "string" },
          model: { type: "string" },
          year: { type: "integer" },
          color: { type: "string" },
          mileage: { type: "integer" },
          fuelType: { $ref: "#/components/schemas/FuelType" },
          seats: { type: "integer" },
          monthlyRent: { type: "number" },
          paidEvery: { type: "integer" },
          minLeaseMonth: { type: "integer" },
          latefee: { type: "integer" },
          features: { type: "object" },
          rules: { type: "string" },
          notes: { type: "string" },
          photos: { type: "array", items: { type: "string", format: "uri" } }
        },
        required: ["title", "type"]
      },
      PropertyUpdateInput: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          status: { $ref: "#/components/schemas/PropertyStatus" },
          address: { type: "string" },
          city: { type: "string" },
          state: { type: "string" },
          zipCode: { type: "string" },
          unitNumber: { type: "string" },
          floorNumber: { type: "integer" },
          bedrooms: { type: "integer" },
          bathrooms: { type: "number" },
          squareFeet: { type: "integer" },
          hasGarage: { type: "boolean" },
          hasGarden: { type: "boolean" },
          totalUnits: { type: "integer" },
          hasElevator: { type: "boolean" },
          hasParking: { type: "boolean" },
          hasGym: { type: "boolean" },
          hasPool: { type: "boolean" },
          hasSecurity: { type: "boolean" },
          yearBuilt: { type: "integer" },
          plateNumber: { type: "string" },
          brand: { type: "string" },
          model: { type: "string" },
          year: { type: "integer" },
          color: { type: "string" },
          mileage: { type: "integer" },
          fuelType: { $ref: "#/components/schemas/FuelType" },
          seats: { type: "integer" },
          monthlyRent: { type: "number" },
          paidEvery: { type: "integer" },
          minLeaseMonth: { type: "integer" },
          latefee: { type: "integer" },
          features: { type: "object" },
          rules: { type: "string" },
          notes: { type: "string" }
        }
      }
    }
  ,
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" }
    }
  },
  paths: {
    "/users/register": {
      post: {
        tags: ["Users"],
        summary: "Register a new user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UserCreateInput" }
            }
          }
        },
        responses: {
          "201": {
            description: "User created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" }
              }
            }
          },
          "400": { description: "Bad request" }
        }
      }
    },
    "/users/login": {
      post: {
        tags: ["Users"],
        summary: "Login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" }
            }
          }
        },
        responses: {
          "200": {
            description: "Login successful",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginResponse" }
              }
            }
          },
          "401": { description: "Unauthorized" }
        }
      }
    },
    "/users": {
      get: {
        tags: ["Users"],
        summary: "List users",
        responses: {
          "200": {
            description: "A list of users",
            content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/User" } } } }
          }
        }
      }
    },
    "/users/search": {
      get: {
        tags: ["Users"],
        summary: "Search users",
        parameters: [
          { name: "q", in: "query", schema: { type: "string" }, required: false }
        ],
        responses: {
          "200": { description: "Search results", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/User" } } } } }
        }
      }
    },
    "/users/me": {
      get: {
        tags: ["Users"],
        summary: "Get current user",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Current user",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/User" } }
            }
          },
          "401": { description: "Unauthorized" }
        }
      },
      patch: {
        tags: ["Users"],
        summary: "Update current user",
        security: [{ bearerAuth: [] }],
        requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/UserUpdateInput" } } } },
        responses: { "200": { content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } } }
      },
      delete: {
        tags: ["Users"],
        summary: "Delete current user",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Deleted" }, "401": { description: "Unauthorized" } }
      }
    }
    ,
    "/properties": {
      post: {
        tags: ["Properties"],
        summary: "Create a property",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/PropertyCreateInput" } } }
        },
        responses: { "201": { description: "Property created", content: { "application/json": { schema: { $ref: "#/components/schemas/Property" } } } }, "400": { description: "Bad request" } }
      },
      get: {
        tags: ["Properties"],
        summary: "List properties",
        responses: { "200": { description: "A list of properties", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Property" } } } } } }
      }
    },
    "/properties/vacant": {
      get: {
        tags: ["Properties"],
        summary: "List vacant properties",
        responses: { "200": { description: "A list of vacant properties", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Property" } } } } } }
      }
    },
    "/properties/owner/{ownerId}": {
      get: {
        tags: ["Properties"],
        summary: "Get properties by owner",
        parameters: [ { name: "ownerId", in: "path", required: true, schema: { type: "string" } } ],
        responses: { "200": { description: "Properties for owner", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Property" } } } } } }
      }
    },
    "/properties/{propertyId}/units": {
      get: {
        tags: ["Properties"],
        summary: "Get units under a property",
        parameters: [ { name: "propertyId", in: "path", required: true, schema: { type: "string" } } ],
        responses: { "200": { description: "Units list", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Property" } } } } } }
      }
    },
    "/properties/{propertyId}/units/vacant": {
      get: {
        tags: ["Properties"],
        summary: "Get vacant units under a property",
        parameters: [ { name: "propertyId", in: "path", required: true, schema: { type: "string" } } ],
        responses: { "200": { description: "Vacant units list", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Property" } } } } } }
      }
    },
    "/properties/{id}": {
      get: {
        tags: ["Properties"],
        summary: "Get property by ID",
        parameters: [ { name: "id", in: "path", required: true, schema: { type: "string" } } ],
        responses: { "200": { description: "Property", content: { "application/json": { schema: { $ref: "#/components/schemas/Property" } } } }, "404": { description: "Not found" } }
      },
      patch: {
        tags: ["Properties"],
        summary: "Update property",
        security: [{ bearerAuth: [] }],
        parameters: [ { name: "id", in: "path", required: true, schema: { type: "string" } } ],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/PropertyUpdateInput" } } } },
        responses: { "200": { description: "Updated property", content: { "application/json": { schema: { $ref: "#/components/schemas/Property" } } } }, "400": { description: "Bad request" } }
      }
    },
    "/notifications": {
      get: {
        tags: ["Notifications"],
        summary: "Get my notifications",
        description: "Retrieve all notifications for the authenticated user",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "List of notifications",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Notification" }
                }
              }
            }
          },
          "401": { description: "Unauthorized" }
        }
      }
    },
    "/notifications/read/{id}": {
      post: {
        tags: ["Notifications"],
        summary: "Mark notification as read",
        description: "Mark a specific notification as read by ID",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Notification ID" }
        ],
        responses: {
          "200": {
            description: "Notification marked as read",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Notification" }
              }
            }
          },
          "401": { description: "Unauthorized" },
          "404": { description: "Notification not found" }
        }
      }
    }
 
  },
};

export default swaggerDocument;
