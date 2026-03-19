import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === USERS ===
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });

// === SUPPLIERS ===
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  logo: text("logo"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  availability: text("availability"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({ id: true, createdAt: true });

// === PRODUCTS ===
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  price: decimal("price").notNull(),
  image: text("image").notNull(),
  images: jsonb("images").$type<string[]>().default([]),
  colors: jsonb("colors").$type<string[]>().default([]),
  sizes: jsonb("sizes").$type<string[]>().default([]),
  isPromo: boolean("is_promo").default(false),
  discount: integer("discount").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true });

// === CATEGORIES ===
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  productCount: integer("product_count").default(0),
});

export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });

// === ORDERS ===
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerLocation: text("customer_location"),
  deliveryType: text("delivery_type"),
  deliveryDate: timestamp("delivery_date"),
  deliveryFee: decimal("delivery_fee").default("0"),
  notes: text("notes"),
  commune: text("commune"),
  quartier: text("quartier"),
  deliveryPersonId: integer("delivery_person_id"),
  amount: decimal("amount").notNull(),
  status: text("status").notNull(), // pending, processing, completed, cancelled
  date: timestamp("date").defaultNow(),
  items: jsonb("items")
    .$type<
      {
        productId?: number;
        name: string;
        quantity: number;
        price: number;
        color?: string;
        size?: string;
        supplierId?: number;
        supplierName?: string;
      }[]
    >()
    .notNull(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, date: true });

// === TESTIMONIALS ===
export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  authorName: text("author_name").notNull(),
  avatarUrl: text("avatar_url"),
  rating: integer("rating").notNull(),
  content: text("content").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTestimonialSchema = createInsertSchema(testimonials).omit({ id: true, createdAt: true });

// === SETTINGS ===
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(), // 'social_links', 'banner'
  value: jsonb("value").notNull(),
});

export const insertSettingSchema = createInsertSchema(settings).omit({ id: true });

// === DELIVERY PERSONS ===
export const deliveryPersons = pgTable("delivery_persons", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  vehicleType: text("vehicle_type"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDeliveryPersonSchema = createInsertSchema(deliveryPersons).omit({ id: true, createdAt: true });

// === TYPES ===
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;

export type DeliveryPerson = typeof deliveryPersons.$inferSelect;
export type InsertDeliveryPerson = z.infer<typeof insertDeliveryPersonSchema>;

export type DashboardStats = {
  totalOrders: number;
  revenue: number;
  pendingOrders: number;
  activeProducts: number;
};

export type SalesData = {
  name: string;
  total: number;
}[];

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
