import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import ProductCard from "@/components/ProductCard";
import { ArrowRight, MapPin, Instagram, ChevronDown, Tag } from "lucide-react";

function useFadeIn(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

// Проверка активна ли скидка
function isDiscountActive(product: any): boolean {
  if (!product.discountPrice || !product.discountUntil) return false;
  const [d, m, y] = product.discountUntil.split(".");
  const until = new Date(`20${y}-${m}-${d}`);
  return until >= new Date();
}

export default function Home() {
  const { data: products } = trpc.products.list.useQuery({});
  const { data: featured = [] } = trpc.featured.list.useQuery();
  const recordVisit = trpc.visit.record.useMutation();

  // Записываем визит один раз при загрузке
  useEffect(() => {
    recordVisit.mutate();
  }, []);

  const featuredProducts = products?.slice(0, 8) || [];
  const heroRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const benefitsFade = useFadeIn();
  const featuredFade = useFadeIn();
  const productsFade = useFadeIn();
  const brandsFade = useFadeIn();
  const storesFade = useFadeIn();
  const ctaFade = useFadeIn();

  const brands = ["Rorobell", "Biodance", "rom&nd", "VT Cosmetics", "Axis-Y", "Unleashia", "Beauty of Joseon", "COSRX"];

  return (
    <div className="bg-white text-[#1a1a1a]">

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative h-screen min-h-[600px] overflow-hidden">
        <video className="absolute inset-0 w-full h-full object-cover" autoPlay muted loop playsInline
          poster="https://pub-27e0df6017d045e4ab1d84e9030feb63.r2.dev/logo%20hq.png">
          <source src="https://pub-27e0df6017d045e4ab1d84e9030feb63.r2.dev/background%20video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/70" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center text-white px-6">
          <div className="hero-logo-enter mb-8">
            <img src="https://pub-27e0df6017d045e4ab1d84e9030feb63.r2.dev/logo%20hq.png" alt="AMOR Skin Care"
              className="w-28 h-28 md:w-36 md:h-36 rounded-full object-contain bg-white/95 shadow-2xl ring-2 ring-white/30" />
          </div>
          <p className="hero-text-enter text-[10px] md:text-xs tracking-[0.35em] uppercase text-white/70 mb-4 font-light" style={{ animationDelay: "0.2s" }}>
            Premium Korean & European Skincare
          </p>
          <h1 className="hero-text-enter font-serif text-4xl md:text-6xl lg:text-7xl font-light tracking-wide mb-4 leading-tight" style={{ animationDelay: "0.4s" }}>
            AMOR
            <span className="block text-2xl md:text-3xl lg:text-4xl font-light tracking-[0.2em] mt-1 text-white/90">SKIN CARE</span>
          </h1>
          <p className="hero-text-enter font-serif italic text-lg md:text-2xl text-white/85 mb-10 tracking-wide" style={{ animationDelay: "0.6s" }}>
            "Твой premium skincare space."
          </p>
          <div className="hero-text-enter flex flex-col sm:flex-row gap-4 items-center" style={{ animationDelay: "0.8s" }}>
            <Link href="/catalog">
              <button className="group flex items-center gap-3 bg-white text-[#1a1a1a] px-8 py-3.5 text-xs tracking-[0.2em] uppercase font-medium hover:bg-[#1a1a1a] hover:text-white transition-all duration-300">
                Смотреть каталог <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </Link>
            <a href="https://wa.me/7774779779" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2.5 border border-white/60 text-white px-8 py-3.5 text-xs tracking-[0.2em] uppercase font-medium hover:bg-white hover:text-[#1a1a1a] transition-all duration-300">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </a>
          </div>
        </div>
        <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-10 transition-opacity duration-500 ${scrolled ? "opacity-0" : "opacity-100"}`}>
          <ChevronDown className="w-5 h-5 text-white/60 animate-bounce" />
        </div>
      </section>

      {/* ── BENEFITS BAR ── */}
      <div ref={benefitsFade.ref} className={`border-y border-[#e8e0d8] py-8 transition-all duration-700 ${benefitsFade.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { icon: "✦", title: "100% Оригинал", sub: "Сертифицированная косметика" },
            { icon: "✦", title: "Премиум бренды", sub: "Корейские и европейские марки" },
            { icon: "✦", title: "Быстрая доставка", sub: "По городу или самовывоз" },
            { icon: "✦", title: "Kaspi Red", sub: "Рассрочка без переплат" },
          ].map((b, i) => (
            <div key={i} className="group">
              <p className="text-[#c9a96e] text-lg mb-2 group-hover:scale-110 transition-transform duration-200">{b.icon}</p>
              <p className="text-[11px] tracking-[0.15em] uppercase font-medium text-[#1a1a1a] mb-1">{b.title}</p>
              <p className="text-[11px] text-[#888] font-light">{b.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── АКЦИИ НА ГЛАВНОЙ (показываем только если есть) ── */}
      {featured.length > 0 && (
        <section ref={featuredFade.ref}
          className={`py-20 px-6 max-w-7xl mx-auto transition-all duration-700 ${featuredFade.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="text-center mb-14">
            <p className="text-[10px] tracking-[0.35em] uppercase text-red-500 mb-3 font-medium flex items-center justify-center gap-2">
              <Tag className="w-3.5 h-3.5" /> Специальные предложения
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-light text-[#1a1a1a] tracking-wide">
              Акции и скидки
            </h2>
            <div className="w-12 h-px bg-red-400 mx-auto mt-5" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6">
            {featured.map((fp: any, i: number) => {
              const p = fp.product;
              if (!p) return null;
              const hasDiscount = isDiscountActive(p);
              return (
                <div key={fp.id} className="opacity-0 animate-fade-in-up relative"
                  style={{ animationDelay: `${i * 80}ms`, animationFillMode: "forwards" }}>
                  {/* Лейбл акции */}
                  <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[10px] tracking-[0.1em] uppercase px-2 py-1 font-medium">
                    {fp.label}
                  </div>
                  <Link href={`/product/${p.id}`}>
                    <div className="group cursor-pointer">
                      <div className="relative overflow-hidden bg-[#f5f0eb] aspect-[3/4] mb-3">
                        {p.imageUrl
                          ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          : <div className="w-full h-full flex items-center justify-center text-[#ccc] text-4xl">✦</div>
                        }
                      </div>
                      <p className="text-[10px] tracking-[0.15em] uppercase text-[#888] mb-1">{p.brand}</p>
                      <p className="text-sm font-light text-[#1a1a1a] line-clamp-2 mb-2">{p.name}</p>
                      {hasDiscount ? (
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-[#aaa] line-through">{Number(p.price).toLocaleString("ru-KZ")} ₸</p>
                          <p className="text-sm font-medium text-red-600">{Number(p.discountPrice).toLocaleString("ru-KZ")} ₸</p>
                        </div>
                      ) : (
                        <p className="text-sm font-medium text-[#1a1a1a]">{Number(p.price).toLocaleString("ru-KZ")} ₸</p>
                      )}
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── FEATURED PRODUCTS ── */}
      <section ref={productsFade.ref}
        className={`py-20 px-6 max-w-7xl mx-auto transition-all duration-700 ${productsFade.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        <div className="text-center mb-14">
          <p className="text-[10px] tracking-[0.35em] uppercase text-[#c9a96e] mb-3 font-medium">Наши товары</p>
          <h2 className="font-serif text-3xl md:text-4xl font-light text-[#1a1a1a] tracking-wide">Популярные средства</h2>
          <div className="w-12 h-px bg-[#c9a96e] mx-auto mt-5" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6">
          {featuredProducts.length > 0
            ? featuredProducts.map((product, i) => (
              <div key={product.id} className="opacity-0 animate-fade-in-up" style={{ animationDelay: `${i * 80}ms`, animationFillMode: "forwards" }}>
                <ProductCard product={product} />
              </div>
            ))
            : Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[3/4] bg-[#f5f0eb] animate-pulse" />)
          }
        </div>
        <div className="text-center mt-12">
          <Link href="/catalog">
            <button className="group inline-flex items-center gap-3 border border-[#1a1a1a] text-[#1a1a1a] px-10 py-3.5 text-xs tracking-[0.2em] uppercase font-medium hover:bg-[#1a1a1a] hover:text-white transition-all duration-300">
              Весь каталог <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </Link>
        </div>
      </section>

      {/* ── BRANDS MARQUEE ── */}
<div ref={brandsFade.ref} className={`py-12 bg-[#faf7f4] border-y border-[#e8e0d8] overflow-hidden transition-all duration-700 ${brandsFade.visible ? "opacity-100" : "opacity-0"}`}>
  <p className="text-center text-[10px] tracking-[0.35em] uppercase text-[#c9a96e] mb-6 font-medium">Наши бренды</p>

  {/* Строка 1 — вправо, корейские */}
  <div className="relative flex overflow-hidden mb-4">
    <div className="flex gap-12 animate-marquee-right whitespace-nowrap">
      {[
        "Biodance", "SKIN1004", "Anua", "Medicube", "Round Lab", "rom&nd",
        "COSRX", "Beauty of Joseon", "Medi-Peel", "TIRTIR", "Laneige",
        "By Wishtrend", "Tocobo", "Rejuran", "Klairs", "Manyo", "Genosys",
        "Torriden", "Isntree", "I'm From", "Re:NK", "Pyunkang Yul",
        "Biodance", "SKIN1004", "Anua", "Medicube", "Round Lab", "rom&nd",
        "COSRX", "Beauty of Joseon", "Medi-Peel", "TIRTIR", "Laneige",
        "By Wishtrend", "Tocobo", "Rejuran", "Klairs", "Manyo", "Genosys",
        "Torriden", "Isntree", "I'm From", "Re:NK", "Pyunkang Yul",
      ].map((b, i) => (
        <span key={i} className="text-sm tracking-[0.15em] uppercase text-[#888] font-light flex items-center gap-12">
          {b} <span className="text-[#c9a96e] text-xs">✦</span>
        </span>
      ))}
    </div>
  </div>

  {/* Строка 2 — влево, европейские и американские */}
  <div className="relative flex overflow-hidden">
    <div className="flex gap-12 animate-marquee-left whitespace-nowrap">
      {[
        "Charlotte Tilbury", "Dior", "YSL", "Rare Beauty", "Hourglass",
        "Babor", "Paula's Choice", "Anastasia Beverly Hills", "Maybelline",
        "Davines", "TIGI", "Rausch", "Marvis", "Vivienne Sabo", "Givenchy",
        "Tom Ford", "Guerlain", "Huda Beauty", "Fenty", "Pat McGrath",
        "Charlotte Tilbury", "Dior", "YSL", "Rare Beauty", "Hourglass",
        "Babor", "Paula's Choice", "Anastasia Beverly Hills", "Maybelline",
        "Davines", "TIGI", "Rausch", "Marvis", "Vivienne Sabo", "Givenchy",
        "Tom Ford", "Guerlain", "Huda Beauty", "Fenty", "Pat McGrath",
      ].map((b, i) => (
        <span key={i} className="text-sm tracking-[0.15em] uppercase text-[#888] font-light flex items-center gap-12">
          {b} <span className="text-[#c9a96e] text-xs">✦</span>
        </span>
      ))}
    </div>
  </div>
</div>

      {/* ── EDITORIAL BANNER ── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-0 items-stretch">
          <div className="relative overflow-hidden bg-[#f5f0eb] aspect-[4/5] md:aspect-auto">
            <img src="https://pub-27e0df6017d045e4ab1d84e9030feb63.r2.dev/logo%20hq.png" alt="Amor Skincare" className="w-full h-full object-contain p-12 md:p-16" />
          </div>
          <div className="bg-[#1a1a1a] text-white flex flex-col justify-center px-10 md:px-16 py-16">
            <p className="text-[10px] tracking-[0.35em] uppercase text-[#c9a96e] mb-6 font-medium">О нас</p>
            <h2 className="font-serif text-3xl md:text-4xl font-light leading-snug mb-6 tracking-wide">Косметика,<br />которой<br />можно доверять</h2>
            <div className="w-10 h-px bg-[#c9a96e] mb-6" />
            <p className="text-sm text-white/70 font-light leading-relaxed mb-8">
              Amor Skincare — это тщательно отобранные корейские и европейские бренды для вашей кожи. Только сертифицированная продукция, только оригинальные товары. Мы помогаем каждому найти идеальный уход.
            </p>
            <a href="https://www.instagram.com/amor.skincare.kz/" target="_blank" rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 border border-white/40 text-white px-8 py-3 text-xs tracking-[0.2em] uppercase font-medium hover:bg-white hover:text-[#1a1a1a] transition-all duration-300 w-fit">
              <Instagram className="w-3.5 h-3.5" /> Instagram
            </a>
          </div>
        </div>
      </section>

      {/* ── STORES ── */}
      <section ref={storesFade.ref}
        className={`py-20 px-6 bg-[#faf7f4] border-t border-[#e8e0d8] transition-all duration-700 ${storesFade.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[10px] tracking-[0.35em] uppercase text-[#c9a96e] mb-3 font-medium">Наши магазины</p>
          <h2 className="font-serif text-3xl md:text-4xl font-light text-[#1a1a1a] tracking-wide mb-3">Найдите нас</h2>
          <div className="w-12 h-px bg-[#c9a96e] mx-auto mb-12" />
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { city: "Уральск", address: "ТРЦ Атриум", hours: "10:00 – 21:00" },
              { city: "Аксай", address: "Asia Plaza", hours: "10:00 – 21:00" },
            ].map((store, i) => (
              <div key={i} className="group border border-[#e8e0d8] bg-white p-10 hover:border-[#c9a96e] transition-colors duration-300">
                <MapPin className="w-5 h-5 text-[#c9a96e] mx-auto mb-4" />
                <h3 className="font-serif text-xl font-light text-[#1a1a1a] mb-1 tracking-wide">{store.city}</h3>
                <p className="text-sm text-[#888] font-light mb-4">{store.address}</p>
                <div className="w-8 h-px bg-[#e8e0d8] mx-auto mb-4 group-hover:bg-[#c9a96e] transition-colors duration-300" />
                <p className="text-[11px] tracking-[0.1em] uppercase text-[#888]">{store.hours}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section ref={ctaFade.ref}
        className={`py-20 px-6 text-center transition-all duration-700 ${ctaFade.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        <div className="max-w-xl mx-auto">
          <p className="text-[10px] tracking-[0.35em] uppercase text-[#c9a96e] mb-3 font-medium">Связаться</p>
          <h2 className="font-serif text-3xl md:text-4xl font-light text-[#1a1a1a] tracking-wide mb-4">Есть вопросы?</h2>
          <p className="text-sm text-[#888] font-light mb-8 leading-relaxed">Напишите нам в WhatsApp — поможем подобрать уход для вашего типа кожи</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="https://wa.me/7774779779" target="_blank" rel="noopener noreferrer"
              className="group inline-flex items-center justify-center gap-3 bg-[#25D366] text-white px-10 py-3.5 text-xs tracking-[0.2em] uppercase font-medium hover:bg-[#1ebe5d] transition-all duration-300">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Написать в WhatsApp
            </a>
            <a href="https://www.instagram.com/amor.skincare.kz/" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 border border-[#1a1a1a] text-[#1a1a1a] px-10 py-3.5 text-xs tracking-[0.2em] uppercase font-medium hover:bg-[#1a1a1a] hover:text-white transition-all duration-300">
              <Instagram className="w-3.5 h-3.5" /> Instagram
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
