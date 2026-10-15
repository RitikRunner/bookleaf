import { NextResponse } from "next/server";

export async function GET() {
  const openApiSpec = {
    openapi: "3.0.3",
    info: {
      title: "BookLeaf Author Support & Communication Portal API",
      version: "1.0.0",
      description:
        "Production REST API for BookLeaf Publishing Author Support with AI-assisted response generation, role-based access control, and real-time SSE streaming."
    },
    servers: [
      {
        url: "/api",
        description: "Local / Production API Root"
      }
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "bookleaf_session",
          description: "HTTP-only JWT session cookie containing authenticated userId and role"
        }
      }
    },
    security: [{ cookieAuth: [] }],
    paths: {
      "/auth/login": {
        post: {
          summary: "Authenticate user and set session cookie",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string" }
                  },
                  required: ["email", "password"]
                }
              }
            }
          },
          responses: {
            "200": { description: "Authentication successful, returns user payload" },
            "401": { description: "Invalid credentials" }
          }
        }
      },
      "/auth/switch-persona": {
        post: {
          summary: "1-Click reviewer persona switch for testing",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    persona: {
                      type: "string",
                      enum: ["priya", "kavita", "sneha", "rohit", "admin"]
                    }
                  },
                  required: ["persona"]
                }
              }
            }
          },
          responses: {
            "200": { description: "Switched persona and set new session cookie" }
          }
        }
      },
      "/books": {
        get: {
          summary: "Retrieve author books and production milestone data",
          description: "Authors only receive their own catalog. Admins can view all books or filter by authorId.",
          responses: {
            "200": { description: "List of books with royalty and production details" },
            "401": { description: "Unauthorized" }
          }
        }
      },
      "/tickets": {
        get: {
          summary: "Retrieve support ticket queue",
          description: "Authors receive only their submitted tickets. Admins receive all tickets with support for filtering by status, category, priority, and text search.",
          parameters: [
            { name: "status", in: "query", schema: { type: "string", enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] } },
            { name: "category", in: "query", schema: { type: "string" } },
            { name: "priority", in: "query", schema: { type: "string", enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW"] } },
            { name: "q", in: "query", schema: { type: "string" } }
          ],
          responses: {
            "200": { description: "Array of ticket records" },
            "401": { description: "Unauthorized" }
          }
        },
        post: {
          summary: "Create a new support ticket",
          description: "Author raises a ticket. Automatically triggers AI classification, priority scoring, and grounded draft generation.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    subject: { type: "string" },
                    description: { type: "string" },
                    bookId: { type: "string", nullable: true },
                    attachmentFileName: { type: "string", nullable: true }
                  },
                  required: ["subject", "description"]
                }
              }
            }
          },
          responses: {
            "201": { description: "Ticket created with AI classification and draft response" },
            "400": { description: "Validation failure" }
          }
        }
      },
      "/tickets/{id}": {
        get: {
          summary: "Retrieve ticket details by ID",
          description: "Returns ticket metadata and public message thread. Internal notes are only included if caller has Role.ADMIN. Returns 403 Forbidden if author attempts to access another author's ticket.",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "Ticket details payload" },
            "403": { description: "Forbidden" },
            "404": { description: "Ticket not found" }
          }
        },
        patch: {
          summary: "Update ticket status, overrides, or assignment",
          description: "Staff only. Supports overriding AI category or priority (setting isAiOverridden: true).",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string" },
                    category: { type: "string" },
                    priority: { type: "string" },
                    assignedAdminId: { type: "string" }
                  }
                }
              }
            }
          },
          responses: {
            "200": { description: "Ticket updated" },
            "403": { description: "Forbidden" }
          }
        }
      },
      "/tickets/{id}/messages": {
        post: {
          summary: "Send response message in ticket thread",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    content: { type: "string" },
                    resolved: { type: "boolean" }
                  },
                  required: ["content"]
                }
              }
            }
          },
          responses: {
            "201": { description: "Message added to thread" }
          }
        }
      },
      "/tickets/{id}/notes": {
        post: {
          summary: "Add private staff internal note",
          description: "Restricted to Role.ADMIN. Completely invisible to author.",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { note: { type: "string" } },
                  required: ["note"]
                }
              }
            }
          },
          responses: {
            "201": { description: "Internal note created" },
            "403": { description: "Forbidden" }
          }
        }
      },
      "/tickets/{id}/stream": {
        get: {
          summary: "Server-Sent Events (SSE) real-time stream",
          description: "Streams new messages and status updates to connected clients without page refreshes.",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "text/event-stream connection" }
          }
        }
      }
    }
  };

  return NextResponse.json(openApiSpec);
}
