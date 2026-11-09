// Срок действия скидки. Одна реализация на сервер и сайт.
//
// Дата хранится строкой: админка пишет «дд.мм.гг» (15.11.26), скрипты загрузки скидок —
// «дд.мм.гггг» (15.11.2026). Понимаем оба формата.

/** Конец указанного дня по времени Казахстана (Уральск, UTC+5); null, если дата некорректна. */
export function parseDiscountUntil(value: string | null | undefined): Date | null {
  if (!value) return null;
  const match = /^\s*(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4})\s*$/.exec(value);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = match[3].length === 2 ? 2000 + Number(match[3]) : Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = new Date(`${year}-${pad(month)}-${pad(day)}T23:59:59+05:00`);
  if (Number.isNaN(date.getTime())) return null;
  // «31.02» и подобное JS молча сдвигает на другой месяц — такие даты отклоняем
  if (date.getUTCDate() !== day && new Date(date.getTime() + 5 * 3600_000).getUTCDate() !== day) return null;
  return date;
}

/** Скидка действует, пока не закончился последний день срока. */
export function isDiscountActive(value: string | null | undefined, now: Date = new Date()): boolean {
  const until = parseDiscountUntil(value);
  return until !== null && until >= now;
}
