// Цена товара для заказа считается на сервере из данных товара, а не берётся из браузера.
import { isDiscountActive } from "../shared/discount";

interface PricedProduct {
  price: string | number;
  discountPrice?: string | number | null;
  discountUntil?: string | null; // формат "дд.мм.гг", как в админке и на сайте
}

export { isDiscountActive };

/** Цена, по которой товар продаётся сейчас: акционная (если действует и она ниже обычной) или обычная. */
export function effectivePrice(product: PricedProduct, now = new Date()): number {
  const regular = Number(product.price);
  const discounted = Number(product.discountPrice);
  if (
    product.discountPrice != null &&
    Number.isFinite(discounted) &&
    discounted > 0 &&
    discounted < regular &&
    isDiscountActive(product.discountUntil, now)
  ) {
    return discounted;
  }
  return regular;
}
