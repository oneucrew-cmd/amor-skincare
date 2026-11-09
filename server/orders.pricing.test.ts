import { describe, expect, it, vi, beforeEach } from "vitest";
import type { TrpcContext } from "./_core/context";

// Заказ не должен доверять ценам из браузера: сумма считается из базы товаров.
const products = new Map<number, any>();
const createdOrders: any[] = [];

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getProductsByIds: vi.fn(async (ids: number[]) => ids.map((id) => products.get(id)).filter(Boolean)),
    createOrder: vi.fn(async (data: any) => {
      createdOrders.push(data);
      return { id: 1 };
    }),
    getPromoSettings: vi.fn(async () => ({
      enabled: true,
      code: "AMOR10",
      discountPercent: 10,
      bannerText: "x",
    })),
    hasPreviousOrder: vi.fn(async () => false),
  };
});
vi.mock("./_core/notification", () => ({ notifyOwner: vi.fn(async () => true) }));

import { appRouter } from "./routers";

const ctx: TrpcContext = {
  user: null,
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
};

function order(items: { productId: number; price: number; quantity: number }[], extra: object = {}) {
  return appRouter.createCaller(ctx).orders.create({
    customerName: "Айгерим",
    customerPhone: "+7 777 123 45 67",
    deliveryMethod: "pickup",
    pickupLocation: "Уральск — ТРЦ Атриум",
    paymentMethod: "cash",
    items: items.map((i) => ({ name: "из браузера", ...i })),
    totalAmount: 1,
    ...extra,
  });
}

beforeEach(() => {
  products.clear();
  createdOrders.length = 0;
  products.set(1, { id: 1, name: "Крем", price: "10000.00", inStock: 1, discountPrice: null, discountUntil: null });
  products.set(2, { id: 2, name: "Без цены", price: "0.00", inStock: 1, discountPrice: null, discountUntil: null });
  products.set(3, { id: 3, name: "Нет в наличии", price: "5000.00", inStock: 0, discountPrice: null, discountUntil: null });
  products.set(4, { id: 4, name: "Акционный", price: "8000.00", inStock: 1, discountPrice: "6000.00", discountUntil: "31.12.99" });
});

describe("orders.create — цены из базы", () => {
  it("игнорирует цену и сумму из браузера", async () => {
    await order([{ productId: 1, price: 1, quantity: 2 }]);
    expect(createdOrders[0].totalAmount).toBe("20000.00");
    expect(createdOrders[0].items).toEqual([{ productId: 1, name: "Крем", price: 10000, quantity: 2 }]);
  });

  it("применяет действующую акционную цену", async () => {
    await order([{ productId: 4, price: 99999, quantity: 1 }]);
    expect(createdOrders[0].totalAmount).toBe("6000.00");
  });

  it("считает скидку промокода от серверной суммы", async () => {
    await order([{ productId: 1, price: 1, quantity: 2 }], { promoCode: "amor10" });
    expect(createdOrders[0].totalAmount).toBe("18000.00");
    expect(createdOrders[0].discountAmount).toBe("2000.00");
    expect(createdOrders[0].promoCode).toBe("AMOR10");
  });

  it("объединяет повторяющиеся позиции", async () => {
    await order([
      { productId: 1, price: 1, quantity: 1 },
      { productId: 1, price: 1, quantity: 2 },
    ]);
    expect(createdOrders[0].items).toHaveLength(1);
    expect(createdOrders[0].totalAmount).toBe("30000.00");
  });

  it("не принимает товар с ценой 0", async () => {
    await expect(order([{ productId: 2, price: 0, quantity: 1 }])).rejects.toThrow(/уточняется/);
    expect(createdOrders).toHaveLength(0);
  });

  it("не принимает товар, которого нет в наличии", async () => {
    await expect(order([{ productId: 3, price: 5000, quantity: 1 }])).rejects.toThrow(/нет в наличии/);
  });

  it("не принимает несуществующий товар", async () => {
    await expect(order([{ productId: 999, price: 100, quantity: 1 }])).rejects.toThrow(/больше недоступен/);
  });
});
