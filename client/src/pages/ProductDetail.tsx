import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { ArrowLeft, Plus, Minus, Check } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useCart } from "../contexts/CartContext";
import { toast } from "sonner";
import ProductCard from "../components/ProductCard";

const categoryLabels: Record<string, string> = {
  serum: "Сыворотка",
  cream: "Крем",
  toner: "Тонер",
  mask: "Маска",
  cleanser: "Очищение",
  eye_care: "Уход за глазами",
  sunscreen: "Санскрин",
  other: "Другое",
};

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const productId = parseInt(id ?? "0");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"description" | "ingredients" | "usage">("description");
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  const { data: product, isLoading, error } = trpc.products.get.useQuery({ id: productId });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    const price = (product as any).discountPrice && isDiscountActive(product as any)
      ? parseFloat((product as any).discountPrice)
      : parseFloat(product.price);
    for (let i = 0; i < quantity; i++) {
      addItem({
        productId: product.id,
        name: product.name,
        price,
        imageUrl: product.imageUrl ?? undefined,
        brand: product.brand,
      });
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    toast.success(`${product.name} добавлен в корзину`, {
      description: `${(price * quantity).toLocaleString("ru-KZ")} ₸`,
    });
  };

  function isDiscountActive(p: any): boolean {
    if (!p.discountPrice || !p.discountUntil) return false;
    const [d, m, y] = p.discountUntil.split(".");
    return new Date(`20${y}-${m}-${d}`) >= new Date();
  }

  if (isLoading) {
    return (
      <div className="pt-24 pb-16 bg-white min-h-screen">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div className="skeleton aspect-square" />
            <div className="space-y-6 pt-4">
              <div className="skeleton h-4 w-1/4" />
              <div className="skeleton h-8 w-3/4" />
              <div className="skeleton h-10 w-1/3" />
              <div className="skeleton h-24 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="pt-24 pb-16 bg-white min-h-screen text-center">
        <p className="text-[10px] tracking-[0.35em] uppercase text-[#c9a96e] mb-3 font-medium">Ошибка</p>
        <h2 className="font-serif text-2xl font-light text-[#1a1a1a] mb-6">Товар не найден</h2>
        <Link href="/catalog">
          <button className="inline-flex items-center gap-2 border border-[#1a1a1a] text-[#1a1a1a] px-8 py-3 text-[11px] tracking-[0.2em] uppercase font-medium hover:bg-[#1a1a1a] hover:text-white transition-all duration-300">
            <ArrowLeft className="w-3.5 h-3.5" />
            Вернуться в каталог
          </button>
        </Link>
      </div>
    );
  }

  const hasDiscount = isDiscountActive(product as any);
  const displayPrice = hasDiscount
    ? parseFloat((product as any).discountPrice)
    : parseFloat(product.price);

  return (
    <div className="pt-20 md:pt-24 pb-16 bg-white min-h-screen">
      <div className="max-w-5xl mx-auto px-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[11px] tracking-wide text-[#888] font-light py-6 border-b border-[#e8e0d8] mb-10">
          <Link href="/" className="hover:text-[#1a1a1a] transition-colors">Главная</Link>
          <span className="text-[#ccc]">/</span>
          <Link href="/catalog" className="hover:text-[#1a1a1a] transition-colors">Каталог</Link>
          <span className="text-[#ccc]">/</span>
          <span className="text-[#1a1a1a] truncate max-w-[200px]">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-20">

          {/* Image */}
          <div className="animate-scale-in">
            <div className="aspect-square overflow-hidden bg-[#faf7f4]" style={{ border: "1px solid #e8e0d8" }}>
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#c9a96e" strokeWidth="0.8" className="w-20 h-20 opacity-30">
                    <rect x="3" y="3" width="18" height="18" rx="1"/>
                    <path d="M3 9h18M9 21V9"/>
                  </svg>
                </div>
              )}
            </div>
            <Link href="/catalog">
              <button className="mt-5 flex items-center gap-2 text-[11px] tracking-[0.15em] uppercase text-[#888] font-light hover:text-[#1a1a1a] transition-colors duration-200">
                <ArrowLeft className="w-3.5 h-3.5" />
                Назад в каталог
              </button>
            </Link>
          </div>

          {/* Info */}
          <div className="animate-fade-in-up space-y-6">

            {/* Brand + Category */}
            <div className="flex items-center gap-3">
              <p className="text-[10px] tracking-[0.3em] uppercase text-[#c9a96e] font-medium">{product.brand}</p>
              <span className="text-[#e8e0d8]">|</span>
              <p className="text-[10px] tracking-[0.2em] uppercase text-[#888] font-light">
                {categoryLabels[product.category] ?? product.category}
              </p>
            </div>

            {/* Name */}
            <h1 className="font-serif text-2xl md:text-3xl font-light text-[#1a1a1a] tracking-wide leading-snug">
              {product.name}
            </h1>

            <div className="w-10 h-px bg-[#c9a96e]" />

            {/* Price */}
            <div>
              {hasDiscount ? (
                <>
                  <p className="text-[13px] text-[#aaa] line-through font-light mb-1">
                    {parseFloat(product.price).toLocaleString("ru-KZ")} ₸
                  </p>
                  <div className="flex items-center gap-3">
                    <p className="font-serif text-3xl font-light text-red-500">
                      {displayPrice.toLocaleString("ru-KZ")} ₸
                    </p>
                    <span className="text-xs font-bold text-white bg-red-500 px-2 py-1">
                      -{Math.round((1 - displayPrice / parseFloat(product.price)) * 100)}%
                    </span>
                  </div>
                  {(product as any).discountUntil && (
                    <p className="text-[11px] text-[#aaa] mt-1">
                      Скидка до {(product as any).discountUntil}
                    </p>
                  )}
                </>
              ) : (
                <p className="font-serif text-3xl font-light text-[#1a1a1a]">
                  {parseFloat(product.price).toLocaleString("ru-KZ")} ₸
                </p>
              )}
              {quantity > 1 && (
                <p className="text-[12px] text-[#888] font-light mt-1">
                  Итого: {(displayPrice * quantity).toLocaleString("ru-KZ")} ₸
                </p>
              )}
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${product.inStock ? "bg-[#4ade80]" : "bg-[#f87171]"}`} />
              <p className="text-[11px] tracking-[0.1em] uppercase font-medium text-[#888]">
                {product.inStock ? "В наличии" : "Нет в наличии"}
              </p>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-4">
              <p className="text-[11px] tracking-[0.15em] uppercase text-[#888] font-light">Количество</p>
              <div className="flex items-center" style={{ border: "1px solid #e8e0d8" }}>
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="h-10 w-10 flex items-center justify-center text-[#888] hover:bg-[#faf7f4] hover:text-[#1a1a1a] transition-colors duration-200">
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-10 text-center text-sm font-light text-[#1a1a1a]">{quantity}</span>
                <button onClick={() => setQuantity((q) => q + 1)}
                  className="h-10 w-10 flex items-center justify-center text-[#888] hover:bg-[#faf7f4] hover:text-[#1a1a1a] transition-colors duration-200">
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Add to cart */}
            <div className="flex gap-3">
              <button onClick={handleAddToCart} disabled={!product.inStock}
                className="flex-1 flex items-center justify-center gap-3 py-4 text-[11px] tracking-[0.2em] uppercase font-medium transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: added ? "#c9a96e" : "#1a1a1a", color: "white" }}>
                {added ? <><Check className="w-3.5 h-3.5" />Добавлено</> : "В корзину"}
              </button>
              <Link href="/cart">
                <button className="px-6 py-4 text-[11px] tracking-[0.15em] uppercase font-light text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-all duration-300"
                  style={{ border: "1px solid #e8e0d8" }}>
                  Корзина
                </button>
              </Link>
            </div>

            {/* Tabs */}
            <div style={{ border: "1px solid #e8e0d8" }}>
              <div className="flex" style={{ borderBottom: "1px solid #e8e0d8" }}>
                {(["description", "ingredients", "usage"] as const).map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className="flex-1 py-3.5 text-[10px] tracking-[0.2em] uppercase font-medium transition-all duration-200"
                    style={{
                      color: activeTab === tab ? "#1a1a1a" : "#888",
                      borderBottom: activeTab === tab ? "2px solid #c9a96e" : "2px solid transparent",
                      background: activeTab === tab ? "#faf7f4" : "white",
                    }}>
                    {tab === "description" ? "Описание" : tab === "ingredients" ? "Состав" : "Применение"}
                  </button>
                ))}
              </div>
              <div className="p-5 text-[13px] text-[#555] leading-relaxed font-light min-h-[90px]">
                {activeTab === "description" && (product.description ?? "Описание отсутствует")}
                {activeTab === "ingredients" && (product.ingredients ?? "Состав не указан")}
                {activeTab === "usage" && (product.usage ?? "Инструкция по применению не указана")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Похожие товары */}
      <SimilarProducts currentId={product.id} category={product.category} />
    </div>
  );
}

function SimilarProducts({ currentId, category }: { currentId: number; category: string }) {
  const { data: allProducts } = trpc.products.list.useQuery({} as any);

  const similar = (allProducts ?? [])
    .filter((p: any) => p.id !== currentId && p.category === category && p.inStock > 0)
    .slice(0, 4);

  if (similar.length === 0) return null;

  return (
    <div className="max-w-5xl mx-auto px-6 mt-16 pb-8">
      <div className="border-t border-[#e8e0d8] pt-12">
        <div className="text-center mb-10">
          <p className="text-[10px] tracking-[0.35em] uppercase text-[#c9a96e] mb-2 font-medium">Вам может понравиться</p>
          <h2 className="font-serif text-2xl font-light text-[#1a1a1a] tracking-wide">Похожие товары</h2>
          <div className="w-8 h-px bg-[#c9a96e] mx-auto mt-4" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {similar.map((p: any) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </div>
  );
}
