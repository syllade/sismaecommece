import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  storeName: text("store_name").notNull(),
  managerName: text("manager_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  agreedToTerms: boolean("agreed_to_terms").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  shortDescription: text("short_description"),
  bulletPoints: jsonb("bullet_points").$type<string[]>(),
  metaDescription: text("meta_description"),
  isVariable: boolean("is_variable").notNull().default(false),
  status: text("status").notNull().default('draft'), // draft, published
  createdAt: timestamp("created_at").defaultNow(),
});

export const productVariants = pgTable("product_variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  sku: text("sku"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").notNull().default(0),
  color: text("color"),
  size: text("size"),
  imageUrls: jsonb("image_urls").$type<string[]>(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").notNull(),
  customerName: text("customer_name").notNull(),
  customerAddress: text("customer_address").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default('pending'), // pending, prepared, shipped, delivered
  deliveryPersonId: integer("delivery_person_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const deliveryPeople = pgTable("delivery_people", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  zone: text("zone"), // e.g. "Abidjan - Cocody"
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({ id: true, createdAt: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true });
export const insertProductVariantSchema = createInsertSchema(productVariants).omit({ id: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });
export const insertDeliveryPersonSchema = createInsertSchema(deliveryPeople).omit({ id: true });

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type UpdateProductRequest = Partial<InsertProduct>;

export type ProductVariant = typeof productVariants.$inferSelect;
export type InsertProductVariant = z.infer<typeof insertProductVariantSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type UpdateOrderRequest = Partial<InsertOrder>;

export type DeliveryPerson = typeof deliveryPeople.$inferSelect;

export type AIProductGenRequest = {
  imageUrl?: string;
  keywords: string;
  tone: 'luxe' | 'technique' | 'amical';
  length: 'court' | 'moyen' | 'long';
};

export type AIProductGenResponse = {
  title: string;
  description: string;
  bulletPoints: string[];
  metaDescription: string;
};
