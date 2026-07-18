import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  json,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  brand: varchar("brand", { length: 100 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  subcategory: varchar("subcategory", { length: 100 }),
  description: text("description"),
  ingredients: text("ingredients"),
  usage: text("usage"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: varchar("imageUrl", { length: 500 }),
  inStock: int("inStock").default(1).notNull(),
  // 👇 НОВЫЕ ПОЛЯ для скидок
  discountPrice: decimal("discountPrice", { precision: 10, scale: 2 }),
  discountUntil: varchar("discountUntil", { length: 10 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 50 }).notNull(),
  deliveryAddress: text("deliveryAddress"),
  deliveryMethod: mysqlEnum("deliveryMethod", ["delivery", "pickup"]).default("delivery").notNull(),
  pickupLocation: varchar("pickupLocation", { length: 255 }),
  paymentMethod: mysqlEnum("paymentMethod", ["kaspi_red", "cash"]).notNull(),
  items: json("items").notNull(),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", [
    "new",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ])
    .default("new")
    .notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// 👇 НОВАЯ ТАБЛИЦА — акции на главной странице
export const featuredProducts = mysqlTable("featured_products", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  label: varchar("label", { length: 100 }).default("Акция месяца").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FeaturedProduct = typeof featuredProducts.$inferSelect;
export type InsertFeaturedProduct = typeof featuredProducts.$inferInsert;

// 👇 НОВАЯ ТАБЛИЦА — статистика посещений
export const pageVisits = mysqlTable("page_visits", {
  id: int("id").autoincrement().primaryKey(),
  date: varchar("date", { length: 10 }).notNull().unique(), // формат "2026-07-18"
  count: int("count").default(0).notNull(),
});

export type PageVisit = typeof pageVisits.$inferSelect;
export type InsertPageVisit = typeof pageVisits.$inferInsert;
