import { useState, useEffect, useRef, useMemo } from "react";
import { Search, X, ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";
import { trpc } from "@/lib/trpc";
import ProductCard from "../components/ProductCard";

/* ─── Порядок категорий и иконки ───────────────────── */
const CATEGORY_ORDER = [
  "Уход за лицом",
  "Очищение",
  "Макияж",
  "Уход за телом",
  "Уход за волосами",
  "Парфюмерия",
  "Аксессуары",
  "Наборы",
  "Для дома",
  "Сертификаты",
  "Прочее",
];
const CATEGORY_EMOJI: Record<string, string> = {
  "Уход за лицом": "💧",
  "Очищение": "🫧",
  "Макияж": "💄",
  "Уход за телом": "🧴",
  "Уход за волосами": "💇",
  "Парфюмерия": "🌸",
  "Аксессуары": "🪮",
  "Наборы": "🎁",
  "Для дома": "🏠",
  "Сертификаты": "🎟️",
  "Прочее": "✨",
};

const SORT_OPTIONS = [
  { value: "default",    label: "По умолчанию" },
  { value: "price_asc",  label: "Цена: дешевле" },
  { value: "price_desc", label: "Цена: дороже" },
  { value: "name_asc",   label: "По названию" },
];

/* ─── Scroll-reveal hook ────────────────────────────── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function AnimatedCard({ product, index }: { product: any; index: number }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(32px) scale(0.97)",
        transition: `opacity 0.55s cubic-bezier(0.23,1,0.32,1) ${Math.min(index, 8) * 50}ms, transform 0.55s cubic-bezier(0.23,1,0.32,1) ${Math.min(index, 8) * 50}ms`,
      }}
    >
      <ProductCard product={product} />
    </div>
  );
}

function FilterSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-rose-100/70 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between mb-3 group">
        <span className="font-sans text-foreground" style={{ fontSize: "0.8rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          {title}
        </span>
        {open
          ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
          : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />}
      </button>
      <div style={{ maxHeight: open ? "1000px" : "0", overflow: "hidden", transition: "max-height 0.3s cubic-bezier(0.23,1,0.32,1)" }}>
        {children}
      </div>
    </div>
  );
}

export default function Catalog() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeSubcategory, setActiveSubcategory] = useState("all");
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("Все бренды");
  const [sort, setSort] = useState("default");
  const [priceMax, setPriceMax] = useState(100000);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 48;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => setHeaderVisible(true), 80);
  }, []);

  // Грузим ВСЕ товары один раз, фильтруем на клиенте
  const { data: products, isLoading } = trpc.products.list.useQuery(undefined as any, { keepPreviousData: true } as any);

  // Список категорий (из реальных товаров, в нужном порядке)
  const categories = useMemo(() => {
    const set = new Set<string>();
    (products ?? []).forEach((p: any) => { if (p.category) set.add(p.category); });
    const ordered = CATEGORY_ORDER.filter((c) => set.has(c));
    // добавим те, что не в списке порядка
    Array.from(set).forEach((c) => { if (!ordered.includes(c)) ordered.push(c); });
    return ordered;
  }, [products]);

  // Подкатегории активной категории
  const subcategories = useMemo(() => {
    if (activeCategory === "all") return [];
    const set = new Set<string>();
    (products ?? []).forEach((p: any) => {
      if (p.category === activeCategory && p.subcategory) set.add(p.subcategory);
    });
    return Array.from(set).sort();
  }, [products, activeCategory]);

  // Бренды (из реальных товаров)
  const brands = useMemo(() => {
    const counts: Record<string, number> = {};
    (products ?? []).forEach((p: any) => {
      if (p.brand && p.brand !== "Прочее") counts[p.brand] = (counts[p.brand] || 0) + 1;
    });
    const sorted = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    return ["Все бренды", ...sorted];
  }, [products]);

  const filtered = useMemo(() => {
    return (products ?? [])
      .filter((p: any) => {
        if (activeCategory !== "all" && p.category !== activeCategory) return false;
        if (activeSubcategory !== "all" && p.subcategory !== activeSubcategory) return false;
        if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.brand.toLowerCase().includes(search.toLowerCase())) return false;
        if (brand !== "Все бренды" && p.brand !== brand) return false;
        if (parseFloat(p.price) > priceMax) return false;
        return true;
      })
      .sort((a: any, b: any) => {
        if (sort === "price_asc") return parseFloat(a.price) - parseFloat(b.price);
        if (sort === "price_desc") return parseFloat(b.price) - parseFloat(a.price);
        if (sort === "name_asc") return a.name.localeCompare(b.name);
        return 0;
      });
  }, [products, activeCategory, activeSubcategory, search, brand, priceMax, sort]);

  // Пагинация
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  useEffect(() => { setPage(1); }, [activeCategory, activeSubcategory, search, brand, priceMax, sort]);

  const activeFiltersCount = [brand !== "Все бренды", priceMax < 100000, activeSubcategory !== "all"].filter(Boolean).length;

  const clearAllFilters = () => {
    setBrand("Все бренды");
    setPriceMax(100000);
    setSearch("");
    setActiveCategory("all");
    setActiveSubcategory("all");
  };

  const FilterPanel = () => (
    <div className="space-y-0">
      <FilterSection title="Бренд">
        <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-1">
          {brands.map((b) => (
            <button key={b} onClick={() => setBrand(b)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all duration-200"
              style={{
                background: brand === b ? "oklch(0.50 0.20 12 / 0.10)" : "transparent",
                color: brand === b ? "oklch(0.50 0.20 12)" : "oklch(0.40 0.02 10)",
                fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", fontWeight: brand === b ? 600 : 400,
              }}>
              <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                style={{ borderColor: brand === b ? "oklch(0.50 0.20 12)" : "oklch(0.80 0.03 10)", background: brand === b ? "oklch(0.50 0.20 12)" : "transparent" }}>
                {brand === b && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </span>
              {b}
            </button>
          ))}
        </div>
      </FilterSection>
      <FilterSection title="Цена до">
        <div className="px-1">
          <div className="flex items-center justify-between mb-3">
            <span className="font-sans text-muted-foreground" style={{ fontSize: "0.78rem" }}>0 ₸</span>
            <span className="font-display" style={{ fontSize: "1rem", fontWeight: 500, color: "oklch(0.35 0.18 12)" }}>
              {priceMax.toLocaleString("ru-KZ")} ₸
            </span>
          </div>
          <input type="range" min={1000} max={100000} step={1000} value={priceMax}
            onChange={(e) => setPriceMax(Number(e.target.value))}
            className="w-full accent-primary" style={{ accentColor: "oklch(0.50 0.20 12)" }} />
          <div className="flex justify-between mt-1">
            <span className="font-sans text-muted-foreground" style={{ fontSize: "0.72rem" }}>1 000 ₸</span>
            <span className="font-sans text-muted-foreground" style={{ fontSize: "0.72rem" }}>100 000 ₸</span>
          </div>
        </div>
      </FilterSection>
      {activeFiltersCount > 0 && (
        <button onClick={clearAllFilters}
          className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all duration-200 hover:bg-rose-50"
          style={{ borderColor: "oklch(0.50 0.20 12 / 0.3)", color: "oklch(0.50 0.20 12)", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", fontWeight: 500 }}>
          <X className="h-3.5 w-3.5" />
          Сбросить фильтры
        </button>
      )}
    </div>
  );

  return (
    <div className="pt-20 md:pt-24 pb-20" style={{ background: "oklch(0.99 0.004 10)" }}>
      <div className="container">
        <div className="text-center mb-10 pt-4"
          style={{ opacity: headerVisible ? 1 : 0, transform: headerVisible ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.6s cubic-bezier(0.23,1,0.32,1), transform 0.6s cubic-bezier(0.23,1,0.32,1)" }}>
          <span className="text-eyebrow text-primary mb-2 block">Наш ассортимент</span>
          <h1 className="font-display gradient-text mb-2" style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 400, lineHeight: 1.15 }}>Каталог</h1>
          <p className="font-sans text-muted-foreground" style={{ fontSize: "0.875rem" }}>Премиальная корейская и европейская косметика</p>
        </div>

        {/* Search */}
        <div className="max-w-xl mx-auto mb-8"
          style={{ opacity: headerVisible ? 1 : 0, transform: headerVisible ? "translateY(0)" : "translateY(16px)", transition: "opacity 0.6s cubic-bezier(0.23,1,0.32,1) 0.1s, transform 0.6s cubic-bezier(0.23,1,0.32,1) 0.1s" }}>
          <div className="relative flex items-center"
            style={{ background: "white", border: "1.5px solid oklch(0.91 0.015 10)", borderRadius: "100px", boxShadow: "0 4px 24px oklch(0.50 0.20 12 / 0.07)" }}>
            <Search className="absolute left-5 h-4 w-4 shrink-0" style={{ color: "oklch(0.65 0.08 12)" }} />
            <input type="text" placeholder="Поиск по названию или бренду..." value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", paddingLeft: "2.75rem", paddingRight: search ? "3rem" : "1.25rem", paddingTop: "0.75rem", paddingBottom: "0.75rem", background: "transparent", border: "none", outline: "none", fontFamily: "'DM Sans', sans-serif", fontSize: "0.875rem", color: "oklch(0.15 0.02 10)" }} />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-4 h-6 w-6 rounded-full flex items-center justify-center transition-all hover:scale-110" style={{ background: "oklch(0.93 0.02 10)" }}>
                <X className="h-3 w-3" style={{ color: "oklch(0.50 0.04 10)" }} />
              </button>
            )}
          </div>
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-4"
          style={{ opacity: headerVisible ? 1 : 0, transform: headerVisible ? "translateY(0)" : "translateY(12px)", transition: "opacity 0.6s cubic-bezier(0.23,1,0.32,1) 0.18s, transform 0.6s cubic-bezier(0.23,1,0.32,1) 0.18s" }}>
          <button onClick={() => { setActiveCategory("all"); setActiveSubcategory("all"); }}
            style={pillStyle(activeCategory === "all")}>
            <span style={{ fontSize: "0.85em" }}>✨</span>Все
          </button>
          {categories.map((cat) => (
            <button key={cat} onClick={() => { setActiveCategory(cat); setActiveSubcategory("all"); }}
              style={pillStyle(activeCategory === cat)}>
              <span style={{ fontSize: "0.85em" }}>{CATEGORY_EMOJI[cat] || "✨"}</span>{cat}
            </button>
          ))}
        </div>

        {/* Subcategory pills (второй уровень) */}
        {subcategories.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5 mb-10">
            <button onClick={() => setActiveSubcategory("all")} style={subPillStyle(activeSubcategory === "all")}>Все</button>
            {subcategories.map((sub) => (
              <button key={sub} onClick={() => setActiveSubcategory(sub)} style={subPillStyle(activeSubcategory === sub)}>{sub}</button>
            ))}
          </div>
        )}
        {subcategories.length === 0 && <div className="mb-10" />}

        <div className="flex gap-7 items-start">
          <aside className="hidden lg:block shrink-0"
            style={{ width: "220px", background: "white", borderRadius: "20px", padding: "1.4rem", border: "1px solid oklch(0.93 0.015 10)", boxShadow: "0 4px 24px oklch(0.50 0.20 12 / 0.05)", position: "sticky", top: "100px" }}>
            <div className="flex items-center justify-between mb-5">
              <span className="font-sans" style={{ fontSize: "0.9rem", fontWeight: 700, color: "oklch(0.15 0.02 10)" }}>Фильтры</span>
              {activeFiltersCount > 0 && (
                <span className="flex items-center justify-center rounded-full text-white" style={{ width: "20px", height: "20px", background: "oklch(0.50 0.20 12)", fontSize: "0.65rem", fontWeight: 700 }}>{activeFiltersCount}</span>
              )}
            </div>
            <FilterPanel />
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="font-sans text-muted-foreground" style={{ fontSize: "0.82rem" }}>
                  {isLoading ? "Загрузка..." : `${filtered.length} товаров`}
                </span>
                {activeFiltersCount > 0 && (
                  <button onClick={clearAllFilters} className="flex items-center gap-1 px-2.5 py-1 rounded-full transition-all hover:scale-105" style={{ background: "oklch(0.50 0.20 12 / 0.10)", color: "oklch(0.50 0.20 12)", fontFamily: "'DM Sans', sans-serif", fontSize: "0.72rem", fontWeight: 500 }}>
                    <X className="h-3 w-3" />Сбросить
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowMobileFilters(true)} className="lg:hidden flex items-center gap-1.5 px-3.5 py-2 rounded-full border transition-all" style={{ border: "1.5px solid oklch(0.88 0.02 10)", fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", fontWeight: 500, color: "oklch(0.35 0.03 10)", background: "white" }}>
                  <SlidersHorizontal className="h-3.5 w-3.5" />Фильтры
                  {activeFiltersCount > 0 && <span className="rounded-full text-white flex items-center justify-center" style={{ width: "16px", height: "16px", background: "oklch(0.50 0.20 12)", fontSize: "0.6rem", fontWeight: 700 }}>{activeFiltersCount}</span>}
                </button>
                <div className="relative">
                  <select value={sort} onChange={(e) => setSort(e.target.value)}
                    style={{ appearance: "none", padding: "0.45rem 2.2rem 0.45rem 0.9rem", borderRadius: "100px", border: "1.5px solid oklch(0.88 0.02 10)", background: "white", fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", fontWeight: 400, color: "oklch(0.35 0.03 10)", cursor: "pointer", outline: "none" }}>
                    {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style={{ color: "oklch(0.55 0.04 10)" }} />
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden bg-white border border-rose-50">
                    <div className="aspect-square bg-gradient-to-br from-rose-50 to-pink-50/40 animate-pulse" />
                    <div className="p-3.5 space-y-2">
                      <div className="h-2.5 rounded-full bg-rose-50 animate-pulse w-1/3" />
                      <div className="h-3.5 rounded-full bg-gray-100 animate-pulse w-4/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-24">
                <div className="text-6xl mb-5">🌸</div>
                <h3 className="font-display mb-2" style={{ fontSize: "1.4rem", fontWeight: 400 }}>Товары не найдены</h3>
                <p className="font-sans text-muted-foreground mb-6" style={{ fontSize: "0.875rem" }}>Попробуйте изменить фильтры или поисковый запрос</p>
                <button onClick={clearAllFilters} className="btn-amor" style={{ fontSize: "0.85rem" }}>Сбросить все фильтры</button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {paged.map((product: any, i: number) => <AnimatedCard key={product.id} product={product} index={i} />)}
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10 flex-wrap">
                    <button onClick={() => { setPage(Math.max(1, page - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }} disabled={page === 1}
                      style={pageBtnStyle(false, page === 1)}>← Назад</button>
                    {Array.from({ length: totalPages }).map((_, i) => i + 1)
                      .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 2)
                      .map((n, idx, arr) => (
                        <span key={n} className="flex items-center">
                          {idx > 0 && arr[idx - 1] !== n - 1 && <span style={{ padding: "0 6px", color: "oklch(0.6 0.02 10)" }}>…</span>}
                          <button onClick={() => { setPage(n); window.scrollTo({ top: 0, behavior: "smooth" }); }} style={pageBtnStyle(page === n, false)}>{n}</button>
                        </span>
                      ))}
                    <button onClick={() => { setPage(Math.min(totalPages, page + 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }} disabled={page === totalPages}
                      style={pageBtnStyle(false, page === totalPages)}>Далее →</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {showMobileFilters && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)} style={{ animation: "fadeIn 0.2s ease" }} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl overflow-y-auto" style={{ maxHeight: "85vh", padding: "1.5rem", animation: "slideUp 0.35s cubic-bezier(0.23,1,0.32,1)" }}>
            <div className="flex items-center justify-between mb-6">
              <span className="font-sans" style={{ fontSize: "1rem", fontWeight: 700 }}>Фильтры</span>
              <button onClick={() => setShowMobileFilters(false)} className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: "oklch(0.95 0.01 10)" }}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <FilterPanel />
            <button onClick={() => setShowMobileFilters(false)} className="btn-amor w-full mt-6 justify-center" style={{ fontSize: "0.875rem" }}>
              Показать {filtered.length} товаров
            </button>
          </div>
        </>
      )}
      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
    </div>
  );
}

/* стили кнопок */
function pillStyle(active: boolean): React.CSSProperties {
  return {
    display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.45rem 1.1rem", borderRadius: "100px",
    fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", fontWeight: active ? 600 : 400, letterSpacing: "0.01em",
    border: active ? "1.5px solid transparent" : "1.5px solid oklch(0.88 0.02 10)",
    background: active ? "linear-gradient(135deg, oklch(0.50 0.20 12), oklch(0.60 0.18 15))" : "white",
    color: active ? "white" : "oklch(0.40 0.03 10)",
    boxShadow: active ? "0 4px 16px oklch(0.50 0.20 12 / 0.28)" : "none",
    transform: active ? "translateY(-1px)" : "translateY(0)", transition: "all 0.22s cubic-bezier(0.23,1,0.32,1)", cursor: "pointer",
  };
}
function subPillStyle(active: boolean): React.CSSProperties {
  return {
    padding: "0.3rem 0.85rem", borderRadius: "100px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem",
    fontWeight: active ? 600 : 400, border: active ? "1px solid oklch(0.50 0.20 12)" : "1px solid oklch(0.90 0.02 10)",
    background: active ? "oklch(0.50 0.20 12 / 0.10)" : "white", color: active ? "oklch(0.50 0.20 12)" : "oklch(0.45 0.03 10)",
    cursor: "pointer", transition: "all 0.2s",
  };
}
function pageBtnStyle(active: boolean, disabled: boolean): React.CSSProperties {
  return {
    minWidth: "38px", padding: "0.4rem 0.8rem", borderRadius: "10px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem",
    fontWeight: active ? 700 : 500, border: active ? "1.5px solid transparent" : "1.5px solid oklch(0.88 0.02 10)",
    background: active ? "linear-gradient(135deg, oklch(0.50 0.20 12), oklch(0.60 0.18 15))" : "white",
    color: active ? "white" : disabled ? "oklch(0.75 0.02 10)" : "oklch(0.40 0.03 10)",
    cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, transition: "all 0.2s",
  };
}
