import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { X, Copy } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

// Высота полосы. Navbar и <main> сдвигаются на неё через CSS-переменную --promo-h.
const BANNER_HEIGHT = 40;

const DISMISSED_KEY = "amor_promo_dismissed"; // хранит "код|процент", чтобы после смены акции баннер показался снова
export const HAS_ORDERED_KEY = "amor_has_ordered"; // ставится после оформленного заказа — акция только для новых клиентов

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export default function PromoBanner() {
  const [location] = useLocation();
  const { data: promo } = trpc.promo.get.useQuery(undefined, { staleTime: 60_000 });
  const [dismissedKey, setDismissedKey] = useState<string | null>(() => readStorage(DISMISSED_KEY));

  const isAdminPage = location.startsWith("/admin");
  const promoKey = promo ? `${promo.code}|${promo.discountPercent}` : "";
  const visible =
    !!promo &&
    promo.enabled &&
    !isAdminPage &&
    dismissedKey !== promoKey &&
    readStorage(HAS_ORDERED_KEY) !== "1";

  useEffect(() => {
    document.documentElement.style.setProperty("--promo-h", visible ? `${BANNER_HEIGHT}px` : "0px");
    return () => {
      document.documentElement.style.setProperty("--promo-h", "0px");
    };
  }, [visible]);

  if (!visible || !promo) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, promoKey);
    } catch {
      /* приватный режим — просто скрываем до перезагрузки */
    }
    setDismissedKey(promoKey);
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(promo.code);
      toast.success(`Промокод ${promo.code} скопирован`, {
        description: "Вставьте его при оформлении заказа",
      });
    } catch {
      toast.info(`Ваш промокод: ${promo.code}`);
    }
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-center gap-3 bg-[#1a1a1a] px-10 text-white"
      style={{ height: BANNER_HEIGHT }}
      role="region"
      aria-label="Акция"
    >
      <p className="truncate text-[11px] font-light tracking-[0.08em] sm:text-xs">{promo.bannerText}</p>
      <button
        type="button"
        onClick={copyCode}
        className="inline-flex shrink-0 items-center gap-1.5 border border-[#c9a96e] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.15em] text-[#c9a96e] transition-colors hover:bg-[#c9a96e] hover:text-[#1a1a1a]"
        aria-label={`Скопировать промокод ${promo.code}`}
      >
        <Copy className="h-3 w-3" />
        <span className="hidden sm:inline">Скопировать</span>
        <span className="sm:hidden">{promo.code}</span>
      </button>
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/60 transition-colors hover:text-white"
        aria-label="Закрыть"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
