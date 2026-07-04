import { Link } from "wouter";
import { MapPin, Clock, Instagram, Heart } from "lucide-react";

const LOGO_URL = "https://pub-27e0df6017d045e4ab1d84e9030feb63.r2.dev/logo%20hq.png";

export default function Footer() {
  return (
    <footer style={{ background: "#1a1a1a" }}>
      <div className="container py-14 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="md:col-span-2 space-y-5">
            <div className="flex items-center gap-4">
              <img
                  src={LOGO_URL}
                  alt="Amor Skincare"
                  className="h-14 w-14 rounded-full object-contain bg-white"
                  style={{ outline: "1px solid rgba(255,255,255,0.15)" }}
                />
              <div>
                <div className="font-serif text-2xl font-light tracking-[0.2em] text-white">AMOR</div>
                <div className="text-[9px] tracking-[0.3em] uppercase font-light text-white/50">SKIN CARE</div>
              </div>
            </div>
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: "oklch(0.60 0.04 10)" }}>
              "Твой premium skincare space." — Премиальная корейская и европейская косметика.
              Профессиональный подбор ухода для вашей кожи.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://www.instagram.com/amor.skincare.kz/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 text-[10px] tracking-[0.15em] uppercase font-medium transition-all duration-200 hover:bg-white hover:text-[#1a1a1a]"
                style={{
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                <Instagram className="h-3.5 w-3.5" />
                @amor.skincare.kz
              </a>
              <a
                href="https://wa.me/77774779779"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 text-[10px] tracking-[0.15em] uppercase font-medium transition-all duration-200 hover:bg-[#25D366] hover:text-white"
                style={{
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </a>
            </div>
          </div>

          {/* Locations */}
          <div className="space-y-4">
            <h3 className="text-[10px] tracking-[0.3em] uppercase font-medium text-[#c9a96e] mb-4">Магазины</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-3.5 w-3.5 text-[#c9a96e] shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-light text-white/80">Уральск</div>
                  <div className="text-xs text-white/40 font-light">ТРЦ Атриум</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="h-3.5 w-3.5 text-[#c9a96e] shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-light text-white/80">Аксай</div>
                  <div className="text-xs text-white/40 font-light">Asia Plaza</div>
                </div>
              </div>
            </div>
          </div>

          {/* Hours & Nav */}
          <div className="space-y-4">
            <h3 className="text-[10px] tracking-[0.3em] uppercase font-medium text-[#c9a96e] mb-4">Информация</h3>
            <div className="flex items-start gap-2.5">
                <Clock className="h-3.5 w-3.5 text-[#c9a96e] shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-light text-white/80">Режим работы</div>
                <div className="text-xs text-white/40 font-light">Пн–Вс: 10:00–21:00</div>
              </div>
            </div>
            <div className="space-y-2 pt-1">
              <Link href="/catalog">
                <div className="text-sm font-light transition-colors cursor-pointer hover:text-white text-white/40">
                  Каталог товаров
                </div>
              </Link>
              <Link href="/cart">
                <div className="text-sm font-light transition-colors cursor-pointer hover:text-white text-white/40">
                  Корзина
                </div>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.3)" }}>
          <div>© 2025 Amor Skincare. Все права защищены.</div>
          <div className="flex items-center gap-1">
            Сделано с <Heart className="h-3 w-3 mx-0.5" style={{ color: "oklch(0.52 0.20 12)", fill: "oklch(0.52 0.20 12)" }} /> для красоты
          </div>
        </div>
      </div>
    </footer>
  );
}
