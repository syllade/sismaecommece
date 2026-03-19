import { z } from "zod";
import { insertSupplierSchema, insertProductSchema, insertOrderSchema, suppliers, products, orders } from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  suppliers: {
    create: {
      method: "POST" as const,
      path: "/api/suppliers" as const,
      input: insertSupplierSchema,
      responses: {
        201: z.custom<typeof suppliers.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/suppliers/:id" as const,
      responses: {
        200: z.custom<typeof suppliers.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    }
  },
  products: {
    list: {
      method: "GET" as const,
      path: "/api/supplier/products" as const,
      responses: {
        200: z.array(z.custom<typeof products.$inferSelect>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/supplier/products" as const,
      input: insertProductSchema,
      responses: {
        201: z.custom<typeof products.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/supplier/products/:id" as const,
      input: insertProductSchema.partial(),
      responses: {
        200: z.custom<typeof products.$inferSelect>(),
        404: errorSchemas.notFound,
      }
    },
    aiGenerate: {
      method: "POST" as const,
      path: "/api/products/ai-generate" as const,
      input: z.object({
        imageUrl: z.string().optional(),
        keywords: z.string(),
        tone: z.enum(["luxe", "technique", "amical"]),
        length: z.enum(["court", "moyen", "long"]),
      }),
      responses: {
        200: z.object({
          title: z.string(),
          description: z.string(),
          bulletPoints: z.array(z.string()),
          metaDescription: z.string(),
        }),
      }
    }
  },
  orders: {
    list: {
      method: "GET" as const,
      path: "/api/orders" as const,
      responses: {
        200: z.array(z.custom<typeof orders.$inferSelect>()),
      },
    },
    updateStatus: {
      method: "PATCH" as const,
      path: "/api/orders/:id/status" as const,
      input: z.object({
        status: z.enum(['pending', 'prepared', 'shipped', 'delivered']),
        deliveryPersonId: z.number().optional(),
      }),
      responses: {
        200: z.custom<typeof orders.$inferSelect>(),
        404: errorSchemas.notFound,
      }
    },
    deliveryPeople: {
      method: "GET" as const,
      path: "/api/delivery-people" as const,
      responses: {
        200: z.array(z.object({ id: z.number(), name: z.string() })),
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
