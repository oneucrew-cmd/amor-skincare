import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingCart, Menu, X } from "lucide-react";
import { useCart } from "../contexts/CartContext";

const LOGO_URL = "https://pub-27e0df6017d045e4ab1d84e9030feb63.r2.dev/logo%20hq.png";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { totalItems } = useCart();
  const [location] = useLocation();
  const [prevCartCount, setPrevCartCount] = useState(totalItems);
  const [cartAnimating, setCartAnimating] = useState(false);

  // Only the home page has a dark hero — all other pages have light backgrounds
  const isHome = location === "/";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (totalItems > prevCartCount) {
      setCartAnimating(true);
      setTimeout(() => setCartAnimating(false), 600);
    }
    setPrevCartCount(totalItems);
  }, [totalItems, prevCartCount]);

  // On home page: transparent (white text) until scrolled; on other pages: always white bg
  const isTransparent = isHome && !scrolled;

  const navLinks = [
    { href: "/", label: "Главная" },
    { href: "/catalog", label: "Каталог" },
  ];

  return (
    <nav
              className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isTransparent
          ? "bg-transparent"
          : "bg-white/98 backdrop-blur-md shadow-sm border-b border-[#e8e0d8]"
      }`}
      style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
    >
      <div className="container">
        <div className="flex items-center justify-between h-16 md:h-20">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src={LOGO_URL}
              alt="Amor Skincare"
              className="rounded-full transition-transform duration-300 group-hover:scale-105 shrink-0 ring-1"
              style={{ height: "42px", width: "42px", objectFit: "contain", background: "white", outline: isTransparent ? "1px solid rgba(255,255,255,0.4)" : "1px solid #e8e0d8" }}
            />
            <div className="hidden sm:flex flex-col leading-none">
              <span
                className="font-display"
                style={{
                  fontSize: "1.35rem",
                  fontWeight: 500,
                  letterSpacing: "0.08em",
                  lineHeight: 1.1,
                  color: isTransparent ? "white" : "oklch(0.13 0.02 10)",
                  transition: "color 0.4s ease",
                }}
              >
                AMOR
              </span>
              <span
                className="font-sans"
                style={{
                  fontSize: "0.6rem",
                  letterSpacing: "0.20em",
                  textTransform: "uppercase",
                  fontWeight: 400,
                  color: isTransparent ? "rgba(255,255,255,0.65)" : "oklch(0.55 0.04 10)",
                  transition: "color 0.4s ease",
                }}
              >
                skin care
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative text-[10px] tracking-[0.25em] uppercase font-medium transition-all duration-200"
                style={{
                  color: isTransparent
                    ? location === link.href ? "white" : "rgba(255,255,255,0.75)"
                    : location === link.href ? "#c9a96e" : "#1a1a1a",
                  transition: "color 0.4s ease",
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* WhatsApp */}
            <a
              href="https://wa.me/7774779779"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 hover:shadow-md"
              style={{
                background: isTransparent ? "rgba(255,255,255,0.15)" : "linear-gradient(135deg, #25D366, #128C7E)",
                border: isTransparent ? "1px solid rgba(255,255,255,0.3)" : "none",
                color: "white",
                backdropFilter: isTransparent ? "blur(10px)" : "none",
                transition: "all 0.4s ease",
              }}
            >
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </a>

            {/* Cart */}
            <Link href="/cart" className="relative p-2.5 rounded-full transition-all duration-200 hover:scale-105 group">
              <ShoppingCart
                className="h-5 w-5 transition-colors duration-200"
                style={{
                  color: isTransparent
                    ? (location as string) === "/cart" ? "white" : "rgba(255,255,255,0.80)"
                    : (location as string) === "/cart" ? "oklch(0.50 0.20 12)" : "oklch(0.35 0.02 10)",
                  transition: "color 0.4s ease",
                }}
              />
              {totalItems > 0 && (
                <span
                  className={`absolute -top-0.5 -right-0.5 min-w-[20px] h-[20px] flex items-center justify-center rounded-full text-[10px] font-bold text-white transition-transform ${
                    cartAnimating ? "scale-125" : "scale-100"
                  }`}
                  style={{ background: "linear-gradient(135deg, oklch(0.52 0.20 12), oklch(0.62 0.18 15))" }}
                >
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded-full transition-colors"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
              style={{ color: isTransparent ? "white" : "oklch(0.25 0.02 10)" }}
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white/98 backdrop-blur-xl border-b border-rose-100 shadow-xl animate-fade-in">
            <div className="container py-5 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    (location as string) === link.href
                      ? "bg-rose-50 text-primary"
                      : "text-foreground/70 hover:bg-rose-50 hover:text-primary"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <a
                href="https://wa.me/7774779779"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-white mt-1"
                style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}
                onClick={() => setIsOpen(false)}
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Написать в WhatsApp
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
