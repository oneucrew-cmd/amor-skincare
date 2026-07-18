import { eq, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  products,
  InsertProduct,
  orders,
  InsertOrder,
  featuredProducts,
  InsertFeaturedProduct,
  pageVisits,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── USERS ───────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── PRODUCTS ────────────────────────────────────────────
export async function getAllProducts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).orderBy(desc(products.createdAt));
}

export async function getProductsByCategory(category: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(eq(products.category, category));
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result[0];
}

export async function createProduct(data: InsertProduct) {
  const db = await getDb();
  if (!db) return;
  return db.insert(products).values(data);
}

export async function updateProduct(id: number, data: Partial<InsertProduct>) {
  const db = await getDb();
  if (!db) return;
  return db.update(products).set(data).where(eq(products.id, id));
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) return;
  return db.delete(products).where(eq(products.id, id));
}

// ─── ORDERS ──────────────────────────────────────────────
export async function createOrder(data: InsertOrder) {
  const db = await getDb();
  if (!db) return;
  const result = await db.insert(orders).values(data);
  const insertId = (result as any)[0]?.insertId;
  return { id: insertId };
}

export async function getAllOrders() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).orderBy(desc(orders.createdAt));
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result[0];
}

export async function updateOrderStatus(id: number, status: InsertOrder["status"]) {
  const db = await getDb();
  if (!db) return;
  return db.update(orders).set({ status }).where(eq(orders.id, id));
}

export async function deleteOrder(id: number) {
  const db = await getDb();
  if (!db) return;
  return db.delete(orders).where(eq(orders.id, id));
}

// ─── FEATURED PRODUCTS (акции на главной) ────────────────
export async function getFeaturedProducts() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(featuredProducts)
    .orderBy(featuredProducts.sortOrder);
  // подтягиваем данные товара для каждого
  const result = await Promise.all(
    rows.map(async (fp) => {
      const product = await getProductById(fp.productId);
      return { ...fp, product };
    })
  );
  return result.filter((r) => r.product);
}

export async function addFeaturedProduct(data: InsertFeaturedProduct) {
  const db = await getDb();
  if (!db) return;
  return db.insert(featuredProducts).values(data);
}

export async function updateFeaturedProduct(id: number, data: Partial<InsertFeaturedProduct>) {
  const db = await getDb();
  if (!db) return;
  return db.update(featuredProducts).set(data).where(eq(featuredProducts.id, id));
}

export async function deleteFeaturedProduct(id: number) {
  const db = await getDb();
  if (!db) return;
  return db.delete(featuredProducts).where(eq(featuredProducts.id, id));
}

// ─── PAGE VISITS (статистика) ─────────────────────────────
export async function recordVisit() {
  const db = await getDb();
  if (!db) return;
  const today = new Date().toISOString().split("T")[0]; // "2026-07-18"
  await db
    .insert(pageVisits)
    .values({ date: today, count: 1 })
    .onDuplicateKeyUpdate({ set: { count: sql`count + 1` } });
}

export async function getVisitStats() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pageVisits).orderBy(desc(pageVisits.date)).limit(30);
}

export async function setVisitCount(date: string, count: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(pageVisits)
    .values({ date, count })
    .onDuplicateKeyUpdate({ set: { count } });
}
