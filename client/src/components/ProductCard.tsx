import { useState } from "react";
import { Link } from "wouter";
import { ShoppingCart, Heart } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { toast } from "sonner";

interface Product {
  id: number;
  name: string;
  brand: string;
  category: string;
  price: string;
  imageUrl?: string | null;
  inStock: number;
  description?: string | null;
  discountPrice?: string | null;
  discountUntil?: string | null;
}

interface ProductCardProps {
  product: Product;
}

const categoryLabels: Record<string, string> = {
  serum: "Сыворотка",
  cream: "Крем",
  toner: "Тонер",
  mask: "Маска",
  cleanser: "Очищение",
  eye_care: "Глаза",
  sunscreen: "Санскрин",
  other: "Другое",
};

function getDiscount(product: Product): { active: boolean; discountPrice: number; percent: number } {
  if (!product.discountPrice || !product.discountUntil) return { active: false, discountPrice: 0, percent: 0 };
  const [d, m, y] = product.discountUntil.split(".");
  const until = new Date(`20${y}-${m}-${d}`);
  if (until < new Date()) return { active: false, discountPrice: 0, percent: 0 };
  const original = parseFloat(product.price);
  const discounted = parseFloat(product.discountPrice);
  const percent = Math.round((1 - discounted / original) * 100);
  return { active: true, discountPrice: discounted, percent };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const [liked, setLiked] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  const discount = getDiscount(product);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAddingToCart(true);
    addItem({
      productId: product.id,
      name: product.name,
      price: discount.active ? discount.discountPrice : parseFloat(product.price),
      imageUrl: product.imageUrl ?? undefined,
      brand: product.brand,
    });
    const displayPrice = discount.active ? discount.discountPrice : parseFloat(product.price);
    toast.success(`${product.name}`, {
      description: `Добавлено в корзину • ${displayPrice.toLocaleString("ru-KZ")} ₸`,
    });
    setTimeout(() => setAddingToCart(false), 600);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLiked(!liked);
  };

  return (
    <Link href={`/product/${product.id}`}>
      <div
        className="group relative bg-white overflow-hidden cursor-pointer h-full flex flex-col transition-all duration-400"
        style={{ border: "1px solid #e8e0d8", transitionTimingFunction: "cubic-bezier(0.23,1,0.32,1)" }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 20px 50px rgba(0,0,0,0.08)";
          (e.currentTarget as HTMLDivElement).style.borderColor = "#c9a96e";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
          (e.currentTarget as HTMLDivElement).style.borderColor = "#e8e0d8";
        }}
      >
        {/* Image */}
        <div className="relative overflow-hidden bg-[#faf7f4]" style={{ aspectRatio: "3 / 4" }}>
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
              style={{ transition: "transform 0.7s cubic-bezier(0.23, 1, 0.32, 1)" }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 px-4 text-center">
              <p className="text-[9px] tracking-[0.2em] uppercase text-[#c9a96e] font-medium">{product.brand}</p>
              <p className="font-serif text-sm text-[#888] font-light leading-snug">{product.name}</p>
            </div>
          )}

          {/* Category badge */}
          <div className="absolute top-3 left-3">
            <span
              className="px-2 py-0.5 text-[9px] tracking-[0.15em] uppercase font-medium"
              style={{ background: "rgba(255,255,255,0.95)", color: "#1a1a1a", border: "1px solid #e8e0d8" }}
            >
              {categoryLabels[product.category] ?? product.category}
            </span>
          </div>

          {/* Скидка бейдж */}
          {discount.active && (
            <div className="absolute top-3 right-10">
              <span
                className="px-2 py-0.5 text-[10px] font-bold tracking-wide"
                style={{ background: "#ef4444", color: "white" }}
              >
                -{discount.percent}%
              </span>
            </div>
          )}

          {/* Wishlist */}
          <button
            onClick={handleLike}
            className="absolute top-3 right-3 h-7 w-7 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-90"
            style={{ background: liked ? "#1a1a1a" : "rgba(255,255,255,0.9)", border: "1px solid #e8e0d8" }}
          >
            <Heart className={`h-3 w-3 transition-all ${liked ? "text-white fill-white" : "text-[#888]"}`} />
          </button>

          {/* Нет в наличии */}
          {product.inStock === 0 && (
            <div className="absolute inset-0 bg-white/75 flex items-center justify-center">
              <span className="text-[10px] tracking-[0.2em] uppercase text-[#888] font-medium">Нет в наличии</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 flex flex-col flex-1">
          <p className="text-[9px] tracking-[0.2em] uppercase font-medium mb-1" style={{ color: "#c9a96e" }}>
            {product.brand}
          </p>
          <h3
            className="font-serif font-light text-[#1a1a1a] leading-snug mb-2.5 flex-1 line-clamp-2 group-hover:text-[#c9a96e] transition-colors duration-200"
            style={{ fontSize: "0.9rem" }}
          >
            {product.name}
          </h3>

          <div className="flex items-center justify-between mt-auto gap-2">
            {/* Цена */}
            <div>
              {discount.active ? (
                <>
                  <p className="text-[11px] text-[#aaa] line-through leading-none mb-0.5">
                    {parseFloat(product.price).toLocaleString("ru-KZ")} ₸
                  </p>
                  <p className="text-[13px] font-medium text-red-500 tracking-wide leading-none">
                    {discount.discountPrice.toLocaleString("ru-KZ")} ₸
                  </p>
                </>
              ) : (
                <span className="text-[13px] font-medium text-[#1a1a1a] tracking-wide">
                  {parseFloat(product.price).toLocaleString("ru-KZ")} ₸
                </span>
              )}
            </div>

            {/* Кнопка в корзину */}
            <button
              onClick={handleAddToCart}
              disabled={product.inStock === 0}
              className="h-8 w-8 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40 flex-shrink-0"
              style={{ background: addingToCart ? "#c9a96e" : "#1a1a1a", color: "white" }}
            >
              <ShoppingCart className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
