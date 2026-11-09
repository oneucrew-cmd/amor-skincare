import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

// Товары с ценой 0 скрыты с сайта, но остаются видны администратору.
const rows = [
  { id: 1, name: "Крем", brand: "A", category: "Уход за лицом", price: "10000.00", inStock: 1 },
  { id: 2, name: "Без цены", brand: "A", category: "Уход за лицом", price: "0.00", inStock: 1 },
];

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getAllProducts: vi.fn(async () => rows),
    getProductsByCategory: vi.fn(async () => rows),
    getProductById: vi.fn(async (id: number) => rows.find((r) => r.id === id)),
  };
});

import { appRouter } from "./routers";

const publicCtx: TrpcContext = {
  user: null,
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
};
const adminCtx: TrpcContext = {
  ...publicCtx,
  user: {
    id: 1, openId: "admin", email: null, name: "Admin", loginMethod: null, role: "admin",
    createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
  } as NonNullable<TrpcContext["user"]>,
};

describe("товары без цены", () => {
  it("не попадают в публичный каталог", async () => {
    const all = await appRouter.createCaller(publicCtx).products.list({});
    expect(all.map((p) => p.id)).toEqual([1]);
    const byCategory = await appRouter.createCaller(publicCtx).products.list({ category: "Уход за лицом" });
    expect(byCategory.map((p) => p.id)).toEqual([1]);
  });

  it("недоступны по прямой ссылке", async () => {
    await expect(appRouter.createCaller(publicCtx).products.get({ id: 2 })).rejects.toThrow(/not found/i);
    await expect(appRouter.createCaller(publicCtx).products.get({ id: 1 })).resolves.toMatchObject({ id: 1 });
  });

  it("видны администратору в полном списке", async () => {
    const all = await appRouter.createCaller(adminCtx).products.listAll();
    expect(all.map((p) => p.id)).toEqual([1, 2]);
  });

  it("полный список закрыт для посетителей", async () => {
    await expect(appRouter.createCaller(publicCtx).products.listAll()).rejects.toThrow();
  });
});
