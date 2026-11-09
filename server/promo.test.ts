import { describe, expect, it } from "vitest";
import {
  computeDiscount,
  evaluatePromo,
  normalizeCode,
  phoneKey,
  renderBannerText,
} from "./promo";
import { titleWithoutCode } from "../shared/promoText";

describe("phoneKey", () => {
  it("приводит разные форматы одного номера к одному ключу", () => {
    const formats = ["+7 777 123 45 67", "8 (777) 123-45-67", "87771234567", "7771234567"];
    const keys = new Set(formats.map(phoneKey));
    expect(keys.size).toBe(1);
    expect([...keys][0]).toBe("7771234567");
  });

  it("не ломается на коротких номерах", () => {
    expect(phoneKey("123-45-67")).toBe("1234567");
  });
});

describe("normalizeCode", () => {
  it("убирает пробелы и приводит к верхнему регистру", () => {
    expect(normalizeCode(" amor 10 ")).toBe("AMOR10");
  });
});

describe("renderBannerText", () => {
  it("подставляет код и процент", () => {
    const text = renderBannerText("Скидка {percent}% — промокод {code}", {
      code: "AMOR10",
      discountPercent: 10,
    });
    expect(text).toBe("Скидка 10% — промокод AMOR10");
  });
});

describe("computeDiscount", () => {
  it("считает процент и округляет до целых тенге", () => {
    expect(computeDiscount(10000, 10)).toBe(1000);
    expect(computeDiscount(12345, 10)).toBe(1235);
  });

  it("никогда не превышает сумму заказа", () => {
    expect(computeDiscount(500, 150)).toBe(500);
    expect(computeDiscount(0, 10)).toBe(0);
  });
});

describe("evaluatePromo", () => {
  const settings = { enabled: true, code: "AMOR10" };
  const base = { settings, enteredCode: "amor10", phone: "+7 777 123 45 67", hasPreviousOrder: false };

  it("принимает код без учёта регистра для нового покупателя", () => {
    expect(evaluatePromo(base)).toBeNull();
  });

  it("отклоняет неверный код", () => {
    expect(evaluatePromo({ ...base, enteredCode: "WRONG" })).toBe("wrong_code");
  });

  it("отклоняет, если акция выключена в админке", () => {
    expect(evaluatePromo({ ...base, settings: { ...settings, enabled: false } })).toBe("disabled");
  });

  it("отклоняет повторную покупку", () => {
    expect(evaluatePromo({ ...base, hasPreviousOrder: true })).toBe("not_first_order");
  });

  it("требует телефон", () => {
    expect(evaluatePromo({ ...base, phone: "" })).toBe("no_phone");
  });
});

describe("titleWithoutCode", () => {
  it("убирает повтор кода из заголовка", () => {
    expect(titleWithoutCode("Скидка 10% на первую покупку — промокод AMOR10", "AMOR10")).toBe("Скидка 10% на первую покупку");
    expect(titleWithoutCode("Скидка 10% на первую покупку, промокод: AMOR10", "AMOR10")).toBe("Скидка 10% на первую покупку,");
  });

  it("не трогает текст без такого оборота и не ломается на спецсимволах", () => {
    expect(titleWithoutCode("Скидка 15% новым клиентам", "AMOR10")).toBe("Скидка 15% новым клиентам");
    expect(titleWithoutCode("Скидка по коду A+B", "A+B")).toBe("Скидка по коду A+B");
  });

  it("если после удаления ничего не осталось — возвращает исходный текст", () => {
    expect(titleWithoutCode("промокод AMOR10", "AMOR10")).toBe("промокод AMOR10");
  });
});
