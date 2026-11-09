import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { X, Copy, Check, Gift } from "lucide-react";
import { trpc } from "@/lib/trpc";

const DISMISSED_KEY = "amor_promo_dismissed"; // "код|процент": после смены акции уведомление покажется снова
export const HAS_ORDERED_KEY = "amor_has_ordered"; // ставится после оформленного заказа — акция только для новых клиентов
const SHOWN_SESSION_KEY = "amor_promo_shown"; // в одной сессии не показываем повторно после перезагрузки
const SHOW_DELAY_MS = 1500;

function read(storage: Storage | undefined, key: string): string | null {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function write(storage: Storage | undefined, key: string, value: string) {
  try {
    storage?.setItem(key, value);
  } catch {
    /* приватный режим — не критично */
  }
}

/** Всплывающее уведомление с промокодом первой покупки. Показывается один раз при первом заходе. */
export default function PromoPopup() {
  const [location] = useLocation();
  const { data: promo } = trpc.promo.get.useQuery(undefined, { staleTime: 60_000 });
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const promoKey = promo ? `${promo.code}|${promo.discountPercent}` : "";
  const hiddenPage = location.startsWith("/admin") || location === "/checkout" || location === "/order-confirmation";
  const eligible =
    !!promo &&
    promo.enabled &&
    read(localStorage, DISMISSED_KEY) !== promoKey &&
    read(localStorage, HAS_ORDERED_KEY) !== "1" &&
    read(sessionStorage, SHOWN_SESSION_KEY) !== promoKey;

  // Первый показ — через небольшую паузу после загрузки страницы
  useEffect(() => {
    if (!eligible || hiddenPage || open) return;
    const timer = setTimeout(() => {
      write(sessionStorage, SHOWN_SESSION_KEY, promoKey);
      setOpen(true);
    }, SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [eligible, hiddenPage, open, promoKey]);

  if (!open || !promo || hiddenPage) return null;

  const dismiss = () => {
    write(localStorage, DISMISSED_KEY, promoKey);
    setOpen(false);
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(promo.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* буфер недоступен — код всё равно виден на карточке */
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Скидка на первую покупку"
      className="fixed bottom-24 left-4 right-4 z-[60] animate-fade-in-up bg-white shadow-2xl sm:bottom-6 sm:left-6 sm:right-auto sm:w-[340px]"
      style={{ border: "1px solid #e8e0d8" }}
    >
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-2 top-2 p-1.5 text-[#888] transition-colors hover:text-[#1a1a1a]"
        aria-label="Закрыть"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="p-5 pr-9">
        <p className="mb-2 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.3em] text-[#c9a96e]">
          <Gift className="h-3.5 w-3.5" /> Для новых клиентов
        </p>
        <p className="font-serif text-xl font-light leading-snug text-[#1a1a1a]">{promo.bannerText}</p>

        <div className="mt-4 flex items-stretch gap-2">
          <div
            className="flex flex-1 items-center justify-center bg-[#faf7f4] px-3 py-2.5 text-sm font-medium uppercase tracking-[0.2em] text-[#1a1a1a]"
            style={{ border: "1px dashed #c9a96e" }}
          >
            {promo.code}
          </div>
          <button
            type="button"
            onClick={copyCode}
            className="inline-flex shrink-0 items-center gap-1.5 bg-[#1a1a1a] px-4 text-[10px] font-medium uppercase tracking-[0.15em] text-white transition-colors hover:bg-[#c9a96e]"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Скопировано" : "Копировать"}
          </button>
        </div>

        <p className="mt-3 text-[11px] font-light text-[#888]">Введите промокод при оформлении заказа.</p>

        <Link href="/catalog" onClick={dismiss}>
          <span className="mt-3 inline-block cursor-pointer text-[11px] font-medium uppercase tracking-[0.15em] text-[#c9a96e] hover:underline">
            Перейти в каталог →
          </span>
        </Link>
      </div>
    </div>
  );
}
