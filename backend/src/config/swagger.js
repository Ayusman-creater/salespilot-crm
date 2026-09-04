import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "CRM Sales Management API",
      version: "1.0.0",
      description:
        "REST API for the CRM Sales Management System — leads, customers, deals, activities, dashboard analytics, and role-based access control (Admin, Sales Manager, Sales Executive).",
    },
    servers: [
      { url: "/api", description: "Current server" },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "token",
          description: "httpOnly JWT cookie set on login",
        },
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Alternative: pass the JWT as 'Authorization: Bearer <token>'",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string" },
          },
        },
      },
    },
    security: [{ cookieAuth: [] }, { bearerAuth: [] }],
  },
  // Scans these files for JSDoc @openapi / @swagger comment blocks
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
