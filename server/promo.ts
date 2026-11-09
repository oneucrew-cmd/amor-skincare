// Чистая логика промокода «скидка на первую покупку» — без доступа к БД,
// чтобы её было легко тестировать.

export const DEFAULT_PROMO = {
  enabled: true,
  code: "AMOR10",
  discountPercent: 10,
  bannerText: "Скидка {percent}% на первую покупку — промокод {code}",
} as const;

/** Ключ телефона для сравнения: только цифры, последние 10 (без +7 / 8 в начале). */
export function phoneKey(phone: string): string {
  return phone.replace(/\D/g, "").slice(-10);
}

/** Код промокода приводим к единому виду: без пробелов, в верхнем регистре. */
export function normalizeCode(code: string): string {
  return code.replace(/\s+/g, "").toUpperCase();
}

/** Подставляет {code} и {percent} в текст баннера. */
export function renderBannerText(
  template: string,
  promo: { code: string; discountPercent: number }
): string {
  return template
    .replaceAll("{code}", promo.code)
    .replaceAll("{percent}", String(promo.discountPercent));
}

/** Сумма скидки в целых тенге. */
export function computeDiscount(subtotal: number, percent: number): number {
  const discount = Math.round((subtotal * percent) / 100);
  return Math.min(Math.max(discount, 0), subtotal);
}

export type PromoRejection =
  | "disabled"
  | "wrong_code"
  | "no_phone"
  | "not_first_order";

export const PROMO_REJECTION_MESSAGES: Record<PromoRejection, string> = {
  disabled: "Промокод сейчас не действует",
  wrong_code: "Промокод не найден",
  no_phone: "Введите номер телефона, чтобы применить промокод",
  not_first_order: "Промокод действует только на первую покупку",
};

/** Проверка промокода без обращения к БД: решение по уже известным данным. */
export function evaluatePromo(args: {
  settings: { enabled: boolean; code: string };
  enteredCode: string;
  phone: string;
  hasPreviousOrder: boolean;
}): PromoRejection | null {
  if (!args.settings.enabled) return "disabled";
  if (normalizeCode(args.enteredCode) !== normalizeCode(args.settings.code)) return "wrong_code";
  if (phoneKey(args.phone).length < 7) return "no_phone";
  if (args.hasPreviousOrder) return "not_first_order";
  return null;
}
