import { describe, expect, it } from "vitest";
import { effectivePrice, isDiscountActive } from "./pricing";
import { findDuplicateGroups, hasNoPrice, normalizeProductName } from "../shared/catalog";

describe("effectivePrice", () => {
  const now = new Date("2026-11-09T10:00:00Z");

  it("без акции — обычная цена", () => {
    expect(effectivePrice({ price: "10000.00" }, now)).toBe(10000);
  });

  it("действующая акция — акционная цена", () => {
    expect(effectivePrice({ price: "10000", discountPrice: "7000", discountUntil: "01.12.26" }, now)).toBe(7000);
  });

  it("просроченная акция не действует", () => {
    expect(effectivePrice({ price: "10000", discountPrice: "7000", discountUntil: "01.10.26" }, now)).toBe(10000);
  });

  it("акционная цена выше обычной или нулевая игнорируется", () => {
    expect(effectivePrice({ price: "10000", discountPrice: "12000", discountUntil: "01.12.26" }, now)).toBe(10000);
    expect(effectivePrice({ price: "10000", discountPrice: "0", discountUntil: "01.12.26" }, now)).toBe(10000);
  });

  it("битая дата окончания — акции нет", () => {
    expect(isDiscountActive("завтра", now)).toBe(false);
    expect(isDiscountActive(null, now)).toBe(false);
  });
});

describe("hasNoPrice", () => {
  it("находит нулевые и пустые цены", () => {
    expect(hasNoPrice({ price: "0.00" })).toBe(true);
    expect(hasNoPrice({ price: 0 })).toBe(true);
    expect(hasNoPrice({ price: "" })).toBe(true);
    expect(hasNoPrice({ price: null })).toBe(true);
    expect(hasNoPrice({ price: "3500.00" })).toBe(false);
  });
});

describe("findDuplicateGroups", () => {
  const item = (id: number, name: string) => ({ id, name, price: 1000 });

  it("находит одинаковые названия независимо от регистра и знаков", () => {
    const groups = findDuplicateGroups([
      item(1, "DR ALTHEA GREEN TEA FRESH SUNSCREEN"),
      item(2, "Dr. althea green tea fresh sunscreen"),
      item(3, "Другой товар"),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].map((p) => p.id)).toEqual([1, 2]);
  });

  it("не считает дублями оттенки и объёмы", () => {
    expect(findDuplicateGroups([item(1, "Romnd тинт 01"), item(2, "Romnd тинт 02"), item(3, "Ederra shampoo 300ml"), item(4, "Ederra shampoo 600ml")])).toEqual([]);
  });

  it("нормализует название", () => {
    expect(normalizeProductName("  Dr.Althea — Крем!! ")).toBe("dr althea крем");
  });
});

describe("срок скидки (shared/discount)", () => {
  it("понимает формат из админки и из скриптов загрузки", async () => {
    const { isDiscountActive } = await import("../shared/discount");
    const now = new Date("2026-11-09T10:00:00Z");
    expect(isDiscountActive("15.11.26", now)).toBe(true);
    expect(isDiscountActive("15.11.2026", now)).toBe(true);
    expect(isDiscountActive("01.01.2020", now)).toBe(false); // «скрытая» дата из скрипта
  });

  it("скидка действует весь последний день по времени Казахстана", async () => {
    const { isDiscountActive } = await import("../shared/discount");
    expect(isDiscountActive("15.11.2026", new Date("2026-11-15T18:30:00Z"))).toBe(true); // 23:30 по Уральску
    expect(isDiscountActive("15.11.2026", new Date("2026-11-15T19:30:00Z"))).toBe(false); // 00:30 следующего дня
  });

  it("отклоняет несуществующие и битые даты", async () => {
    const { parseDiscountUntil } = await import("../shared/discount");
    expect(parseDiscountUntil("31.02.2026")).toBeNull();
    expect(parseDiscountUntil("32.01.2026")).toBeNull();
    expect(parseDiscountUntil("2026-11-15")).toBeNull();
    expect(parseDiscountUntil("")).toBeNull();
  });

  it("цена заказа учитывает скидку, записанную скриптом (4 цифры года)", () => {
    const now = new Date("2026-11-09T10:00:00Z");
    expect(effectivePrice({ price: "13200", discountPrice: "10560", discountUntil: "15.11.2026" }, now)).toBe(10560);
  });
});
