// Проверки каталога, общие для сервера (тесты) и админки.

export interface CatalogItem {
  id: number;
  name: string;
  brand?: string | null;
  price: string | number;
}

/** Товар без цены: 0, пусто или не число. Такой товар нельзя продавать через корзину. */
export function hasNoPrice(product: { price: string | number | null | undefined }): boolean {
  const price = Number(product.price);
  return !Number.isFinite(price) || price <= 0;
}

/** Название без регистра, знаков препинания и лишних пробелов: "Dr. Althea" = "DR ALTHEA". */
export function normalizeProductName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^0-9a-zа-яё]+/gi, " ")
    .trim();
}

/**
 * Группы товаров с одинаковым названием (после нормализации).
 * Варианты с разными оттенками/объёмом ("тинт 01" и "тинт 02") дублями не считаются.
 */
export function findDuplicateGroups<T extends CatalogItem>(products: T[]): T[][] {
  const groups = new Map<string, T[]>();
  for (const product of products) {
    const key = normalizeProductName(product.name);
    if (!key) continue;
    const list = groups.get(key);
    if (list) list.push(product);
    else groups.set(key, [product]);
  }
  return Array.from(groups.values()).filter((group) => group.length > 1);
}
