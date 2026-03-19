import express from "express";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { existsSync, readFileSync } from "fs";
import {
  products,
  suppliers,
  categories,
  orders,
  testimonials,
  settings,
  users,
  insertProductSchema,
  insertSupplierSchema,
  insertCategorySchema,
  insertOrderSchema,
  insertTestimonialSchema,
  insertSettingSchema,
  deliveryPersons,
  insertDeliveryPersonSchema,
} from "../shared/schema.js";
import { eq, sql, and } from "drizzle-orm";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

function loadEnvFromDotFile() {
  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "..", ".env"),
  ];

  for (const envPath of candidates) {
    if (!existsSync(envPath)) continue;

    const raw = readFileSync(envPath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex <= 0) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value.replace(/^"(.*)"$/, "$1");
      }
    }
  }
}

loadEnvFromDotFile();

// Database connection
if (!process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL environment variable is required. " +
      "Create admin/.env (or ../.env) with DATABASE_URL=postgresql://..."
  );
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

type SessionUser = {
  id: number;
  username: string;
};

function toSessionUser(value: unknown): SessionUser | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  // Accept numeric id as number or numeric string (Postgres drivers sometimes return strings)
  let idNum: number | null = null;
  if (typeof raw.id === "number") idNum = raw.id as number;
  else if (typeof raw.id === "string" && /^\d+$/.test(raw.id)) idNum = Number(raw.id);
  else if (typeof raw.id === "bigint") idNum = Number(raw.id as unknown as bigint);

  if (idNum === null || typeof raw.username !== "string") return null;
  return { id: idNum, username: raw.username };
}

async function ensureDefaultSuperAdmin() {
  try {
    const [countRow] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const userCount = Number(countRow?.count ?? 0);
    if (userCount > 0) return;

    const username = process.env.SUPER_ADMIN_USERNAME || "superadmin";
    const password = process.env.SUPER_ADMIN_PASSWORD || "admin123";
    await db.insert(users).values({ username, password });
    console.log(
      `[Bootstrap] Super admin initial cree: username="${username}". ` +
        "Definissez SUPER_ADMIN_USERNAME/SUPER_ADMIN_PASSWORD pour personnaliser."
    );
  } catch (error) {
    console.warn("[Bootstrap] Table users indisponible, auth fallback via variables d'environnement active.");
  }
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const corsOrigins = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

function isAllowedCorsOrigin(origin: string): boolean {
  if (corsOrigins.includes(origin)) return true;
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
}

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (typeof origin === "string" && isAllowedCorsOrigin(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Vary", "Origin");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Passport configuration
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
      if (!user || user.password !== password) {
        return done(null, false, { message: "Incorrect username or password" });
      }
      return done(null, user);
    } catch (error) {
      const fallbackUsername = process.env.SUPER_ADMIN_USERNAME || "superadmin";
      const fallbackPassword = process.env.SUPER_ADMIN_PASSWORD || "admin123";
      if (username === fallbackUsername && password === fallbackPassword) {
        return done(null, { id: 0, username: fallbackUsername, password: fallbackPassword });
      }
      return done(null, false, { message: "Incorrect username or password" });
    }
  })
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  if (id === 0) {
    const fallbackUsername = process.env.SUPER_ADMIN_USERNAME || "superadmin";
    return done(null, { id: 0, username: fallbackUsername, password: "" });
  }
  try {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    done(null, user);
  } catch (error) {
    done(null, false);
  }
});

app.use(passport.initialize());
app.use(passport.session());

// Authentication middleware
const isAuthenticated = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Non authentifie" });
};

// Login endpoint
app.post("/api/login", (req, res, next) => {
  passport.authenticate("local", (err: unknown, user: unknown) => {
    // Debug logging for authentication attempts
    try {
      console.log("[auth] /api/login attempt", {
        ip: req.ip,
        body: { ...(req.body || {}), password: req.body?.password ? "<redacted>" : undefined },
        err: err ? String(err) : null,
        userFound: !!user,
      });
    } catch (e) {
      // ignore logging errors
    }

    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ message: "Identifiants invalides" });
    }

    req.logIn(user, (loginError) => {
      if (loginError) {
        console.error('[auth] req.logIn error', loginError);
        return next(loginError);
      }

      try {
        const sessionUser = toSessionUser(req.user);
        console.log('[auth] post-login req.user', req.user, 'sessionUser', sessionUser);
        if (!sessionUser) {
          console.error('[auth] invalid session user after login', { rawUser: req.user });
          return res.status(500).json({ message: 'Session utilisateur invalide' });
        }
        return res.json({ message: 'Connexion reussie', user: sessionUser });
      } catch (e) {
        console.error('[auth] unexpected error while creating session user', e);
        return res.status(500).json({ message: 'Internal server error' });
      }
    });
  })(req, res, next);
});

// Logout endpoint
app.post("/api/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.json({ message: "Deconnexion reussie" });
    });
  });
});

// Current session endpoint
app.get("/api/me", (req, res) => {
  const sessionUser = toSessionUser(req.user);
  if (!sessionUser) {
    return res.status(401).json({ message: "Non authentifie" });
  }
  return res.json({ user: sessionUser });
});

// Products routes
app.get("/api/products", isAuthenticated, async (req, res) => {
  try {
    const allProducts = await db.select().from(products);
    res.json(allProducts);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/products", isAuthenticated, async (req, res) => {
  try {
    const validated = insertProductSchema.parse(req.body);
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, validated.supplierId)).limit(1);
    if (!supplier) {
      return res.status(400).json({ message: "Supplier not found", field: "supplierId" });
    }
    const [newProduct] = await db.insert(products).values(validated as any).returning();
    res.status(201).json(newProduct);
  } catch (error: any) {
    if (error.name === "ZodError") {
      res.status(400).json({ message: "Validation error", field: error.errors[0]?.path?.[0] });
    } else {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
});

app.put("/api/products/:id", isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validated = insertProductSchema.partial().parse(req.body);
    if (validated.supplierId) {
      const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, validated.supplierId)).limit(1);
      if (!supplier) {
        return res.status(400).json({ message: "Supplier not found", field: "supplierId" });
      }
    }
    const [updated] = await db
      .update(products)
      .set(validated as any)
      .where(eq(products.id, id))
      .returning();
    if (!updated) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(updated);
  } catch (error: any) {
    if (error.name === "ZodError") {
      res.status(400).json({ message: "Validation error" });
    } else {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
});

app.delete("/api/products/:id", isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [deleted] = await db.delete(products).where(eq(products.id, id)).returning();
    if (!deleted) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Admin products routes (alias)
app.get("/admin/products", isAuthenticated, async (_req, res) => {
  try {
    const allProducts = await db.select().from(products);
    res.json(allProducts);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/admin/products", isAuthenticated, async (req, res) => {
  try {
    const validated = insertProductSchema.parse(req.body);
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, validated.supplierId)).limit(1);
    if (!supplier) {
      return res.status(400).json({ message: "Supplier not found", field: "supplierId" });
    }
    const [newProduct] = await db.insert(products).values(validated as any).returning();
    res.status(201).json(newProduct);
  } catch (error: any) {
    if (error.name === "ZodError") {
      res.status(400).json({ message: "Validation error", field: error.errors[0]?.path?.[0] });
    } else {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
});

app.put("/admin/products/:id", isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validated = insertProductSchema.partial().parse(req.body);
    if (validated.supplierId) {
      const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, validated.supplierId)).limit(1);
      if (!supplier) {
        return res.status(400).json({ message: "Supplier not found", field: "supplierId" });
      }
    }
    const [updated] = await db
      .update(products)
      .set(validated as any)
      .where(eq(products.id, id))
      .returning();
    if (!updated) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(updated);
  } catch (error: any) {
    if (error.name === "ZodError") {
      res.status(400).json({ message: "Validation error" });
    } else {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
});

app.delete("/admin/products/:id", isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [deleted] = await db.delete(products).where(eq(products.id, id)).returning();
    if (!deleted) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Categories routes
app.get("/api/categories", isAuthenticated, async (req, res) => {
  try {
    const allCategories = await db.select().from(categories);
    res.json(allCategories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/categories", isAuthenticated, async (req, res) => {
  try {
    const validated = insertCategorySchema.parse(req.body);
    const [newCategory] = await db.insert(categories).values(validated).returning();
    res.status(201).json(newCategory);
  } catch (error: any) {
    if (error.name === "ZodError") {
      res.status(400).json({ message: "Validation error", field: error.errors[0]?.path?.[0] });
    } else {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
});

app.delete("/api/categories/:id", isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [deleted] = await db.delete(categories).where(eq(categories.id, id)).returning();
    if (!deleted) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Admin categories routes (alias)
app.get("/admin/categories", isAuthenticated, async (_req, res) => {
  try {
    const allCategories = await db.select().from(categories);
    res.json(allCategories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/admin/categories", isAuthenticated, async (req, res) => {
  try {
    const validated = insertCategorySchema.parse(req.body);
    const [newCategory] = await db.insert(categories).values(validated).returning();
    res.status(201).json(newCategory);
  } catch (error: any) {
    if (error.name === "ZodError") {
      res.status(400).json({ message: "Validation error", field: error.errors[0]?.path?.[0] });
    } else {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
});

app.delete("/admin/categories/:id", isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [deleted] = await db.delete(categories).where(eq(categories.id, id)).returning();
    if (!deleted) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Suppliers routes
app.get("/admin/suppliers", isAuthenticated, async (_req, res) => {
  try {
    const list = await db.select().from(suppliers);
    res.json(list);
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/admin/suppliers", isAuthenticated, async (req, res) => {
  try {
    const validated = insertSupplierSchema.parse(req.body);
    const [created] = await db.insert(suppliers).values(validated).returning();
    res.status(201).json(created);
  } catch (error: any) {
    if (error.name === "ZodError") {
      res.status(400).json({ message: "Validation error", field: error.errors[0]?.path?.[0] });
    } else {
      console.error("Error creating supplier:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
});

app.put("/admin/suppliers/:id", isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validated = insertSupplierSchema.partial().parse(req.body);
    const [updated] = await db.update(suppliers).set(validated).where(eq(suppliers.id, id)).returning();
    if (!updated) return res.status(404).json({ message: "Supplier not found" });
    res.json(updated);
  } catch (error: any) {
    if (error.name === "ZodError") {
      res.status(400).json({ message: "Validation error", field: error.errors[0]?.path?.[0] });
    } else {
      console.error("Error updating supplier:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
});

app.delete("/admin/suppliers/:id", isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [deleted] = await db.delete(suppliers).where(eq(suppliers.id, id)).returning();
    if (!deleted) return res.status(404).json({ message: "Supplier not found" });
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting supplier:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delivery persons routes
app.get("/admin/delivery-persons", isAuthenticated, async (_req, res) => {
  try {
    const list = await db.select().from(deliveryPersons);
    res.json(list);
  } catch (error) {
    console.error("Error fetching delivery persons:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/admin/delivery-persons", isAuthenticated, async (req, res) => {
  try {
    const validated = insertDeliveryPersonSchema.parse(req.body);
    const [created] = await db.insert(deliveryPersons).values(validated).returning();
    res.status(201).json(created);
  } catch (error: any) {
    if (error.name === "ZodError") {
      res.status(400).json({ message: "Validation error", field: error.errors[0]?.path?.[0] });
    } else {
      console.error("Error creating delivery person:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
});

app.put("/admin/delivery-persons/:id", isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validated = insertDeliveryPersonSchema.partial().parse(req.body);
    const [updated] = await db.update(deliveryPersons).set(validated).where(eq(deliveryPersons.id, id)).returning();
    if (!updated) return res.status(404).json({ message: "Delivery person not found" });
    res.json(updated);
  } catch (error: any) {
    if (error.name === "ZodError") {
      res.status(400).json({ message: "Validation error", field: error.errors[0]?.path?.[0] });
    } else {
      console.error("Error updating delivery person:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
});

app.delete("/admin/delivery-persons/:id", isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [deleted] = await db.delete(deliveryPersons).where(eq(deliveryPersons.id, id)).returning();
    if (!deleted) return res.status(404).json({ message: "Delivery person not found" });
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting delivery person:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Orders routes
app.get("/api/orders", isAuthenticated, async (req, res) => {
  try {
    const allOrders = await db.select().from(orders);
    res.json(allOrders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/orders/:id", isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Admin orders (list + details)
app.get("/admin/orders", isAuthenticated, async (req, res) => {
  try {
    const list = await db.select().from(orders);
    res.json(list);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/admin/orders/:id", isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Grouped orders (daily) by supplier or delivery person
app.get("/admin/orders/grouped", isAuthenticated, async (req, res) => {
  try {
    const by = (req.query.by as string) || "supplier";
    const dateStr = (req.query.date as string) || null;
    const target = dateStr ? new Date(`${dateStr}T00:00:00`) : new Date();
    const dayStart = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const allOrders = await db.select().from(orders);
    const todays = allOrders.filter((o) => {
      const d = o.date ? new Date(o.date as any) : null;
      if (!d || isNaN(d.getTime())) return false;
      return d.getTime() >= dayStart.getTime() && d.getTime() < dayEnd.getTime();
    });

    if (by === "delivery") {
      const persons = await db.select().from(deliveryPersons);
      const supplierRows = await db.select().from(suppliers);
      const map = new Map<number | "unassigned", { id: number | "unassigned"; name: string; orders: any[] }>();
      for (const order of todays) {
        const key = (order as any).deliveryPersonId ?? "unassigned";
        if (!map.has(key)) {
          const person = persons.find((p) => p.id === key);
          map.set(key, {
            id: key,
            name: person?.name || "Non assigné",
            orders: [],
          });
        }
        map.get(key)!.orders.push(order);
      }
      const groups = Array.from(map.values()).map((group) => {
        const supplierIds = new Set<number>();
        for (const o of group.orders) {
          const items = ((o as any).items || []) as any[];
          items.forEach((it) => {
            if (it.supplierId) supplierIds.add(it.supplierId);
          });
        }
        const supplierVisits = Array.from(supplierIds).map((id) => supplierRows.find((s) => s.id === id)).filter(Boolean);
        return { ...group, supplierVisits };
      });
      return res.json({ date: dayStart.toISOString().slice(0, 10), by, groups });
    }

    // by supplier
    const supplierRows = await db.select().from(suppliers);
    const groupMap = new Map<number | "unknown", { id: number | "unknown"; name: string; orders: any[]; items: any[]; supplier?: any }>();

    for (const order of todays) {
      const items = ((order as any).items || []) as any[];
      for (const item of items) {
        const supplierId = item.supplierId ?? "unknown";
        if (!groupMap.has(supplierId)) {
          const supplier = supplierRows.find((s) => s.id === supplierId);
          groupMap.set(supplierId, {
            id: supplierId,
            name: supplier?.name || item.supplierName || "Fournisseur inconnu",
            orders: [],
            items: [],
            supplier: supplier || null,
          });
        }
        groupMap.get(supplierId)!.orders.push(order);
        groupMap.get(supplierId)!.items.push(item);
      }
    }

    res.json({ date: dayStart.toISOString().slice(0, 10), by, groups: Array.from(groupMap.values()) });
  } catch (error) {
    console.error("Error grouping orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/orders", isAuthenticated, async (req, res) => {
  try {
    const payload = req.body || {};
    const items = Array.isArray(payload.items) ? payload.items : [];
    const productIds = items.map((it: any) => Number(it.product_id || it.productId)).filter(Boolean);
    const productRows = productIds.length
      ? await db.select().from(products).where(sql`${products.id} = ANY(${productIds})`)
      : [];

    const enrichedItems = items.map((it: any) => {
      const product = productRows.find((p) => p.id === Number(it.product_id || it.productId));
      return {
        productId: product?.id ?? Number(it.product_id || it.productId),
        name: product?.name || it.name || "Produit",
        quantity: Number(it.quantity || 1),
        price: Number(product?.price || it.price || 0),
        color: it.color,
        size: it.size,
        supplierId: product?.supplierId,
        supplierName: product ? undefined : it.supplierName,
      };
    });

    const amount = enrichedItems.reduce((sum: number, it: any) => sum + Number(it.price || 0) * Number(it.quantity || 0), 0);

    const newOrder = {
      customerName: payload.customer_name || payload.customerName,
      customerPhone: payload.customer_phone || payload.customerPhone,
      customerLocation: payload.customer_location || payload.customerLocation,
      deliveryType: payload.delivery_type || payload.deliveryType,
      deliveryDate: payload.delivery_date ? new Date(payload.delivery_date) : undefined,
      deliveryFee: payload.delivery_fee ?? 0,
      notes: payload.notes ?? null,
      commune: payload.commune ?? null,
      quartier: payload.quartier ?? null,
      amount,
      status: payload.status || "pending",
      items: enrichedItems,
    };

    const [created] = await db.insert(orders).values(newOrder as any).returning();
    res.status(201).json(created);
  } catch (error: any) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * Envoi des notifications (email / SMS) lors d'un changement de statut.
 * Si send_email est activé côté front, on log ici ; pour un vrai envoi email,
 * ajouter nodemailer et une colonne customer_email sur orders (ou utiliser le téléphone pour SMS).
 */
function notifyStatusChange(order: { id: number; customerName: string; customerPhone: string; status: string }, newStatus: string) {
  const statusLabels: Record<string, string> = {
    pending: "En attente",
    processing: "En cours",
    completed: "Livrée",
    cancelled: "Annulée",
  };
  const label = statusLabels[newStatus] || newStatus;
  console.log(
    `[Notification statut] Commande #${order.id} → ${label}. Client: ${order.customerName}, tél: ${order.customerPhone}. ` +
    "(Configurer SMTP/nodemailer pour envoi email réel au client ; livreur si assigné.)"
  );
}

const updateOrderStatusHandler = async (req: express.Request, res: express.Response) => {
  try {
    const id = parseInt(req.params.id);
    const { status, send_email: sendEmail } = req.body;
    if (!status || typeof status !== "string") {
      return res.status(400).json({ message: "Status is required" });
    }
    const [updated] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    if (!updated) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (sendEmail === true) {
      notifyStatusChange(
        {
          id: updated.id,
          customerName: updated.customerName,
          customerPhone: updated.customerPhone,
          status: updated.status,
        },
        status
      );
    }
    res.json(updated);
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

app.patch("/api/orders/:id/status", isAuthenticated, updateOrderStatusHandler);
app.put("/api/orders/:id/status", isAuthenticated, updateOrderStatusHandler);
app.patch("/admin/orders/:id/status", isAuthenticated, updateOrderStatusHandler);
app.put("/admin/orders/:id/status", isAuthenticated, updateOrderStatusHandler);

app.put("/admin/orders/:id/delivery-date", isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { delivery_date } = req.body || {};
    if (!delivery_date) return res.status(400).json({ message: "delivery_date is required" });
    const [updated] = await db
      .update(orders)
      .set({ deliveryDate: new Date(delivery_date) } as any)
      .where(eq(orders.id, id))
      .returning();
    if (!updated) return res.status(404).json({ message: "Order not found" });
    res.json(updated);
  } catch (error) {
    console.error("Error updating delivery date:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/admin/orders/:id/assign-delivery-person", isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { delivery_person_id } = req.body || {};
    if (!delivery_person_id) return res.status(400).json({ message: "delivery_person_id is required" });
    const [person] = await db
      .select()
      .from(deliveryPersons)
      .where(eq(deliveryPersons.id, Number(delivery_person_id)))
      .limit(1);
    if (!person) return res.status(404).json({ message: "Delivery person not found" });

    const [updated] = await db
      .update(orders)
      .set({ deliveryPersonId: Number(delivery_person_id) } as any)
      .where(eq(orders.id, id))
      .returning();
    if (!updated) return res.status(404).json({ message: "Order not found" });
    res.json(updated);
  } catch (error) {
    console.error("Error assigning delivery person:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/admin/orders/bulk-assign", isAuthenticated, async (req, res) => {
  try {
    const { order_ids, delivery_person_id } = req.body || {};
    const orderIds = Array.isArray(order_ids)
      ? order_ids.map((value: unknown) => Number(value)).filter((value: number) => Number.isFinite(value))
      : [];
    const deliveryPersonId = Number(delivery_person_id);

    if (orderIds.length === 0 || !Number.isFinite(deliveryPersonId)) {
      return res.status(400).json({ message: "order_ids et delivery_person_id sont requis" });
    }

    const [person] = await db
      .select()
      .from(deliveryPersons)
      .where(eq(deliveryPersons.id, deliveryPersonId))
      .limit(1);
    if (!person) {
      return res.status(404).json({ message: "Delivery person not found" });
    }

    const updated = await db
      .update(orders)
      .set({ deliveryPersonId } as any)
      .where(sql`${orders.id} = ANY(${orderIds})`)
      .returning();

    res.json({
      updated_count: updated.length,
      order_ids: updated.map((order) => order.id),
      delivery_person_id: deliveryPersonId,
    });
  } catch (error) {
    console.error("Error bulk assigning delivery person:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Testimonials routes
app.get("/api/testimonials", isAuthenticated, async (req, res) => {
  try {
    const allTestimonials = await db.select().from(testimonials);
    res.json(allTestimonials);
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/testimonials", isAuthenticated, async (req, res) => {
  try {
    const validated = insertTestimonialSchema.parse(req.body);
    const [newTestimonial] = await db.insert(testimonials).values(validated).returning();
    res.status(201).json(newTestimonial);
  } catch (error: any) {
    if (error.name === "ZodError") {
      res.status(400).json({ message: "Validation error", field: error.errors[0]?.path?.[0] });
    } else {
      console.error("Error creating testimonial:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
});

app.put("/api/testimonials/:id", isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validated = insertTestimonialSchema.partial().parse(req.body);
    const [updated] = await db
      .update(testimonials)
      .set(validated)
      .where(eq(testimonials.id, id))
      .returning();
    if (!updated) {
      return res.status(404).json({ message: "Testimonial not found" });
    }
    res.json(updated);
  } catch (error: any) {
    if (error.name === "ZodError") {
      res.status(400).json({ message: "Validation error" });
    } else {
      console.error("Error updating testimonial:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
});

app.delete("/api/testimonials/:id", isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [deleted] = await db.delete(testimonials).where(eq(testimonials.id, id)).returning();
    if (!deleted) {
      return res.status(404).json({ message: "Testimonial not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting testimonial:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Admin testimonials routes (alias)
app.get("/admin/testimonials", isAuthenticated, async (_req, res) => {
  try {
    const allTestimonials = await db.select().from(testimonials);
    res.json(allTestimonials);
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/admin/testimonials", isAuthenticated, async (req, res) => {
  try {
    const validated = insertTestimonialSchema.parse(req.body);
    const [newTestimonial] = await db.insert(testimonials).values(validated).returning();
    res.status(201).json(newTestimonial);
  } catch (error: any) {
    if (error.name === "ZodError") {
      res.status(400).json({ message: "Validation error", field: error.errors[0]?.path?.[0] });
    } else {
      console.error("Error creating testimonial:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
});

app.put("/admin/testimonials/:id", isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validated = insertTestimonialSchema.partial().parse(req.body);
    const [updated] = await db
      .update(testimonials)
      .set(validated)
      .where(eq(testimonials.id, id))
      .returning();
    if (!updated) {
      return res.status(404).json({ message: "Testimonial not found" });
    }
    res.json(updated);
  } catch (error: any) {
    if (error.name === "ZodError") {
      res.status(400).json({ message: "Validation error" });
    } else {
      console.error("Error updating testimonial:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
});

app.delete("/admin/testimonials/:id", isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [deleted] = await db.delete(testimonials).where(eq(testimonials.id, id)).returning();
    if (!deleted) {
      return res.status(404).json({ message: "Testimonial not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting testimonial:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Settings routes
app.get("/api/settings/:key", isAuthenticated, async (req, res) => {
  try {
    const { key } = req.params;
    const [setting] = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
    if (!setting) {
      return res.status(404).json({ message: "Setting not found" });
    }
    res.json(setting);
  } catch (error) {
    console.error("Error fetching setting:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/settings", isAuthenticated, async (req, res) => {
  try {
    const validated = insertSettingSchema.parse(req.body);
    const [existing] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, validated.key))
      .limit(1);
    
    let result;
    if (existing) {
      [result] = await db
        .update(settings)
        .set({ value: validated.value })
        .where(eq(settings.key, validated.key))
        .returning();
    } else {
      [result] = await db.insert(settings).values(validated).returning();
    }
    res.json(result);
  } catch (error: any) {
    if (error.name === "ZodError") {
      res.status(400).json({ message: "Validation error" });
    } else {
      console.error("Error updating setting:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
});

// Stats routes
app.get("/api/stats/dashboard", isAuthenticated, async (req, res) => {
  try {
    const [totalOrdersResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders);
    const totalOrders = Number(totalOrdersResult?.count || 0);

    const [revenueResult] = await db
      .select({ sum: sql<number>`sum(${orders.amount})` })
      .from(orders)
      .where(eq(orders.status, "completed"));
    const revenue = Number(revenueResult?.sum || 0);

    const [pendingOrdersResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.status, "pending"));
    const pendingOrders = Number(pendingOrdersResult?.count || 0);

    const [activeProductsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.isActive, true));
    const activeProducts = Number(activeProductsResult?.count || 0);

    res.json({
      totalOrders,
      revenue,
      pendingOrders,
      activeProducts,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/stats/sales", isAuthenticated, async (req, res) => {
  try {
    // This is a simplified version - you might want to group by date/month
    const salesData = await db
      .select({
        name: sql<string>`to_char(${orders.date}, 'YYYY-MM')`,
        total: sql<number>`sum(${orders.amount})`,
      })
      .from(orders)
      .where(eq(orders.status, "completed"))
      .groupBy(sql`to_char(${orders.date}, 'YYYY-MM')`);
    
    res.json(salesData.map((item) => ({ name: item.name, total: Number(item.total) })));
  } catch (error) {
    console.error("Error fetching sales stats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../dist/public")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../dist/public/index.html"));
  });
}

// =============================================
// Super Admin Analytics Routes
// =============================================

// Dashboard analytics - returns KPIs for super admin
app.get("/api/admin/analytics/dashboard", isAuthenticated, async (req, res) => {
  try {
    // Total orders
    const [totalOrdersResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders);
    const totalOrders = Number(totalOrdersResult?.count || 0);

    // Total revenue from completed orders
    const [revenueResult] = await db
      .select({ sum: sql<number>`sum(${orders.amount})` })
      .from(orders)
      .where(eq(orders.status, "completed"));
    const totalRevenue = { value: Number(revenueResult?.sum || 0) };

    // Pending orders
    const [pendingOrdersResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.status, "pending"));
    const pendingOrders = Number(pendingOrdersResult?.count || 0);

    // Active products count (products without stock tracking not available in this schema)
    const [activeProductsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.isActive, true));
    const outOfStockProducts = 0; // Stock tracking not in current schema

    // Total orders for KPI
    const totalOrdersKpi = { value: totalOrders };

    res.json({
      total_orders: totalOrdersKpi,
      total_revenue: totalRevenue,
      pending_orders: pendingOrders,
      out_of_stock_products: outOfStockProducts,
    });
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Sales analytics - returns sales data by day/week/month
app.get("/api/admin/analytics/sales", isAuthenticated, async (req, res) => {
  try {
    const period = req.query.period as string || "30";
    const days = parseInt(period) || 30;
    
    // Get sales grouped by date for the last N days
    const salesData = await db
      .select({
        date: sql<string>`to_char(${orders.date}, 'YYYY-MM-DD')`,
        total: sql<number>`sum(${orders.amount})`,
      })
      .from(orders)
      .where(sql`${orders.date} >= NOW() - INTERVAL '${days} days'`)
      .groupBy(sql`to_char(${orders.date}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${orders.date}, 'YYYY-MM-DD')`);
    
    res.json(salesData.map((item) => ({ date: item.date, total: Number(item.total) })));
  } catch (error) {
    console.error("Error fetching sales analytics:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// =============================================
// Super Admin Marketing Routes
// =============================================

// Marketing campaigns - placeholder for sponsored products
app.get("/api/admin/marketing/campaigns", isAuthenticated, async (req, res) => {
  try {
    // Return empty array - campaigns would be stored in a separate table
    // This is a placeholder that can be extended with actual campaign management
    res.json([]);
  } catch (error) {
    console.error("Error fetching marketing campaigns:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/admin/marketing/campaigns", isAuthenticated, async (req, res) => {
  try {
    // Placeholder for creating campaigns
    const { product, budget, cpc, ctr, acos, status } = req.body;
    res.status(201).json({
      id: Date.now(),
      product,
      budget,
      cpc,
      ctr,
      acos,
      status: status || "pending",
    });
  } catch (error) {
    console.error("Error creating marketing campaign:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.patch("/api/admin/marketing/campaigns/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    // Placeholder - would update campaign status
    res.json({ id: parseInt(id), status });
  } catch (error) {
    console.error("Error updating marketing campaign:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// =============================================
// Super Admin Settings Routes
// =============================================

// Get global settings
app.get("/api/admin/settings", isAuthenticated, async (req, res) => {
  try {
    const allSettings = await db.select().from(settings);
    const settingsMap: Record<string, string> = {};
    for (const s of allSettings) {
      settingsMap[s.key] = s.value;
    }
    res.json(settingsMap);
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update global settings
app.put("/api/admin/settings", isAuthenticated, async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key) {
      return res.status(400).json({ message: "Key is required" });
    }
    
    const [updated] = await db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value },
      })
      .returning();
    
    res.json(updated);
  } catch (error) {
    console.error("Error updating setting:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// =============================================
// Super Admin Suppliers Management Routes
// =============================================

// Block/unblock supplier
app.post("/api/admin/suppliers/:id/block", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    const [updated] = await db
      .update(suppliers)
      .set({ isActive: isActive ?? false })
      .where(eq(suppliers.id, parseInt(id)))
      .returning();
    
    if (!updated) {
      return res.status(404).json({ message: "Supplier not found" });
    }
    
    res.json(updated);
  } catch (error) {
    console.error("Error blocking supplier:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Reset supplier password (placeholder - would send email)
app.post("/api/admin/suppliers/:id/reset-password", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    // Placeholder - would generate reset token and send email
    res.json({ message: "Password reset email sent", supplierId: parseInt(id) });
  } catch (error) {
    console.error("Error resetting supplier password:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Toggle delivery person status
app.post("/api/admin/delivery-persons/:id/toggle-status", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [person] = await db
      .select()
      .from(deliveryPersons)
      .where(eq(deliveryPersons.id, parseInt(id)))
      .limit(1);
    
    if (!person) {
      return res.status(404).json({ message: "Delivery person not found" });
    }
    
    const [updated] = await db
      .update(deliveryPersons)
      .set({ isActive: !person.isActive })
      .where(eq(deliveryPersons.id, parseInt(id)))
      .returning();
    
    res.json(updated);
  } catch (error) {
    console.error("Error toggling delivery person status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// =============================================
// Super Admin Logistics Routes
// =============================================

// Get logistics data - grouped orders by commune/hour
app.get("/api/admin/logistics/deliveries", isAuthenticated, async (req, res) => {
  try {
    const deliveries = await db
      .select({
        id: orders.id,
        customerName: orders.customerName,
        commune: orders.commune,
        deliveryDate: orders.deliveryDate,
        status: orders.status,
        deliveryType: orders.deliveryType,
      })
      .from(orders)
      .where(sql`${orders.deliveryDate} IS NOT NULL`)
      .orderBy(sql`${orders.deliveryDate}`);
    
    res.json(deliveries);
  } catch (error) {
    console.error("Error fetching logistics data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Group orders by commune for tour planning
app.get("/api/admin/logistics/tours", isAuthenticated, async (req, res) => {
  try {
    const tours = await db
      .select({
        commune: orders.commune,
        count: sql<number>`count(*)`,
        totalAmount: sql<number>`sum(${orders.amount})`,
      })
      .from(orders)
      .where(sql`${orders.status} IN ('pending', 'preparing', 'ready')`)
      .groupBy(orders.commune);
    
    res.json(tours);
  } catch (error) {
    console.error("Error fetching tour data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// =============================================
// Super Admin Reporting Routes
// =============================================

// Get top products
app.get("/api/admin/reports/top-products", isAuthenticated, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    // This would need order_items table join - placeholder
    res.json([]);
  } catch (error) {
    console.error("Error fetching top products:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Export orders as CSV
app.get("/api/admin/reports/orders/export", isAuthenticated, async (req, res) => {
  try {
    const { startDate, endDate, supplierId } = req.query;
    
    let query = db.select().from(orders);
    // Add filters as needed
    const allOrders = await query;
    
    // Convert to CSV format
    const headers = ["ID", "Client", "Montant", "Statut", "Date", "Commune"];
    const rows = allOrders.map(o => [
      o.id,
      o.customerName,
      o.amount,
      o.status,
      o.date,
      o.commune
    ]);
    
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=orders.csv");
    res.send(csv);
  } catch (error) {
    console.error("Error exporting orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// =============================================
// Start Server
// =============================================

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

async function startServer() {
  await ensureDefaultSuperAdmin();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  });
}

startServer().catch((error) => {
  console.error("Unable to start server:", error);
  process.exit(1);
});

