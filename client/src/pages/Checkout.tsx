import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, Truck, Store, CreditCard, Banknote, Check, Tag, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useCart } from "../contexts/CartContext";
import { toast } from "sonner";
import { HAS_ORDERED_KEY } from "../components/PromoBanner";

const PICKUP_LOCATIONS = [
  { value: "uralsk_atrium", label: "Уральск — ТРЦ Атриум" },
  { value: "aksai_asia_plaza", label: "Аксай — Asia Plaza" },
];

const inputClass =
  "w-full px-4 py-3 text-sm font-light text-[#1a1a1a] bg-white focus:outline-none transition-all duration-200";
const inputStyle = { border: "1px solid #e8e0d8" };
const inputFocusStyle = { border: "1px solid #c9a96e" };

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[10px] tracking-[0.25em] uppercase text-[#888] font-medium mb-2">
        {label}
      </label>
      {children}
      {error && <p className="text-red-400 text-[11px] mt-1 font-light">{error}</p>}
    </div>
  );
}

export default function Checkout() {
  const [, navigate] = useLocation();
  const { items, totalAmount, clearCart } = useCart();
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    deliveryMethod: "delivery" as "delivery" | "pickup",
    deliveryAddress: "",
    pickupLocation: "uralsk_atrium",
    paymentMethod: "kaspi_red" as "kaspi_red" | "cash",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Промокод первой покупки. Привязан к номеру телефона, для которого он проверен:
  // если номер изменили — промокод нужно применить заново.
  const utils = trpc.useUtils();
  const [promoInput, setPromoInput] = useState("");
  const [promoChecking, setPromoChecking] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    percent: number;
    phone: string;
  } | null>(null);
  const promo = appliedPromo && appliedPromo.phone === form.customerPhone ? appliedPromo : null;
  const discount = promo ? Math.min(totalAmount, Math.round((totalAmount * promo.percent) / 100)) : 0;
  const payableTotal = totalAmount - discount;

  const applyPromo = async () => {
    const code = promoInput.trim();
    if (!code) return;
    setPromoChecking(true);
    setPromoError("");
    try {
      const res = await utils.promo.check.fetch({ code, phone: form.customerPhone });
      if (res.valid) {
        setAppliedPromo({ code, percent: res.discountPercent, phone: form.customerPhone });
        toast.success(`Скидка ${res.discountPercent}% применена`);
      } else {
        setAppliedPromo(null);
        setPromoError(res.message);
      }
    } catch {
      setPromoError("Не удалось проверить промокод, попробуйте ещё раз");
    } finally {
      setPromoChecking(false);
    }
  };

  const createOrder = trpc.orders.create.useMutation({
    onSuccess: (data) => {
      try {
        localStorage.setItem(HAS_ORDERED_KEY, "1");
      } catch {
        /* не критично */
      }
      clearCart();
      if (data.whatsappUrl) {
        // Прямой переход в WhatsApp — работает на всех устройствах, включая Safari на iPhone
        window.location.href = data.whatsappUrl;
      } else {
        navigate(`/order-confirmation?orderId=${data.orderId}`);
      }
    },
    onError: (err) => {
      // Промокод отклонён при оформлении (например, это не первая покупка): снимаем его,
      // чтобы сумма была верной и заказ можно было оформить без скидки.
      if (err.message.includes("ромокод")) setAppliedPromo(null);
      toast.error("Ошибка при оформлении заказа", { description: err.message });
    },
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.customerName.trim()) e.customerName = "Введите ваше имя";
    if (!form.customerPhone.trim() || form.customerPhone.length < 7)
      e.customerPhone = "Введите корректный номер";
    if (
      form.deliveryMethod === "delivery" &&
      (!form.deliveryAddress.trim() || form.deliveryAddress.length < 5)
    )
      e.deliveryAddress = "Введите адрес доставки";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (items.length === 0) { toast.error("Корзина пуста"); return; }
    createOrder.mutate({
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      deliveryMethod: form.deliveryMethod,
      deliveryAddress: form.deliveryMethod === "delivery" ? form.deliveryAddress : undefined,
      pickupLocation:
        form.deliveryMethod === "pickup"
          ? PICKUP_LOCATIONS.find((l) => l.value === form.pickupLocation)?.label
          : undefined,
      paymentMethod: form.paymentMethod,
      notes: form.notes || undefined,
      items: items.map((i) => ({
        productId: i.productId,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
      totalAmount: payableTotal,
      promoCode: promo ? promo.code : undefined,
    });
  };

  if (items.length === 0) {
    return (
      <div className="pt-28 pb-16 bg-white min-h-screen text-center">
        <p className="text-[10px] tracking-[0.35em] uppercase text-[#c9a96e] mb-3 font-medium">Корзина</p>
        <h2 className="font-serif text-2xl font-light text-[#1a1a1a] mb-6">Корзина пуста</h2>
        <Link href="/catalog">
          <button className="inline-flex items-center gap-3 bg-[#1a1a1a] text-white px-10 py-3.5 text-[11px] tracking-[0.2em] uppercase font-medium hover:bg-[#c9a96e] transition-all duration-300">
            Перейти в каталог
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-20 md:pt-24 pb-16 bg-white min-h-screen">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="py-10 border-b border-[#e8e0d8] mb-10">
          <p className="text-[10px] tracking-[0.35em] uppercase text-[#c9a96e] mb-2 font-medium">Оформление</p>
          <h1 className="font-serif text-3xl md:text-4xl font-light text-[#1a1a1a] tracking-wide">Ваш заказ</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Form */}
            <div className="lg:col-span-2 space-y-8">

              {/* Contact */}
              <div>
                <p className="text-[10px] tracking-[0.35em] uppercase text-[#c9a96e] mb-5 font-medium">Контактные данные</p>
                <div className="space-y-4">
                  <Field label="Ваше имя *" error={errors.customerName}>
                    <input
                      type="text"
                      placeholder="Например: Айгерим"
                      value={form.customerName}
                      onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                      onFocus={() => setFocusedField("name")}
                      onBlur={() => setFocusedField(null)}
                      className={inputClass}
                      style={focusedField === "name" ? inputFocusStyle : inputStyle}
                    />
                  </Field>
                  <Field label="Номер телефона *" error={errors.customerPhone}>
                    <input
                      type="tel"
                      placeholder="+7 777 000 00 00"
                      value={form.customerPhone}
                      onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                      onFocus={() => setFocusedField("phone")}
                      onBlur={() => setFocusedField(null)}
                      className={inputClass}
                      style={focusedField === "phone" ? inputFocusStyle : inputStyle}
                    />
                  </Field>
                </div>
              </div>

              {/* Delivery */}
              <div>
                <p className="text-[10px] tracking-[0.35em] uppercase text-[#c9a96e] mb-5 font-medium">Способ получения</p>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    { value: "delivery", label: "Доставка", desc: "Курьером по городу", icon: <Truck className="h-4 w-4" /> },
                    { value: "pickup", label: "Самовывоз", desc: "Из нашего магазина", icon: <Store className="h-4 w-4" /> },
                  ].map((method) => {
                    const active = form.deliveryMethod === method.value;
                    return (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() => setForm({ ...form, deliveryMethod: method.value as "delivery" | "pickup" })}
                        className="relative p-5 text-left transition-all duration-200"
                        style={{
                          border: active ? "1px solid #c9a96e" : "1px solid #e8e0d8",
                          background: active ? "#faf7f4" : "white",
                        }}
                      >
                        <div className={`mb-3 ${active ? "text-[#c9a96e]" : "text-[#888]"}`}>{method.icon}</div>
                        <p className="text-[11px] tracking-[0.15em] uppercase font-medium text-[#1a1a1a] mb-1">{method.label}</p>
                        <p className="text-[11px] text-[#888] font-light">{method.desc}</p>
                        {active && (
                          <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-[#c9a96e] flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {form.deliveryMethod === "delivery" && (
                  <Field label="Адрес доставки *" error={errors.deliveryAddress}>
                    <textarea
                      placeholder="Город, улица, дом, квартира"
                      value={form.deliveryAddress}
                      onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
                      onFocus={() => setFocusedField("address")}
                      onBlur={() => setFocusedField(null)}
                      rows={3}
                      className={`${inputClass} resize-none`}
                      style={focusedField === "address" ? inputFocusStyle : inputStyle}
                    />
                  </Field>
                )}

                {form.deliveryMethod === "pickup" && (
                  <div>
                    <p className="text-[10px] tracking-[0.2em] uppercase text-[#888] font-medium mb-3">Выберите магазин</p>
                    <div className="space-y-2">
                      {PICKUP_LOCATIONS.map((loc) => {
                        const active = form.pickupLocation === loc.value;
                        return (
                          <button
                            key={loc.value}
                            type="button"
                            onClick={() => setForm({ ...form, pickupLocation: loc.value })}
                            className="w-full flex items-center gap-3 p-4 text-left transition-all duration-200"
                            style={{
                              border: active ? "1px solid #c9a96e" : "1px solid #e8e0d8",
                              background: active ? "#faf7f4" : "white",
                            }}
                          >
                            <Store className={`h-4 w-4 shrink-0 ${active ? "text-[#c9a96e]" : "text-[#888]"}`} />
                            <span className="text-sm font-light text-[#1a1a1a] flex-1">{loc.label}</span>
                            {active && <Check className="h-3.5 w-3.5 text-[#c9a96e]" />}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-[#888] font-light mt-2">Режим работы: Пн–Вс 10:00–21:00</p>
                  </div>
                )}
              </div>

              {/* Payment */}
              <div>
                <p className="text-[10px] tracking-[0.35em] uppercase text-[#c9a96e] mb-5 font-medium">Способ оплаты</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "kaspi_red", label: "Kaspi", desc: "Kaspi Pay / Kaspi Red", icon: <CreditCard className="h-4 w-4" /> },
                    { value: "cash", label: "Наличные", desc: "При получении", icon: <Banknote className="h-4 w-4" /> },
                  ].map((method) => {
                    const active = form.paymentMethod === method.value;
                    return (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() => setForm({ ...form, paymentMethod: method.value as "kaspi_red" | "cash" })}
                        className="relative p-5 text-left transition-all duration-200"
                        style={{
                          border: active ? "1px solid #c9a96e" : "1px solid #e8e0d8",
                          background: active ? "#faf7f4" : "white",
                        }}
                      >
                        <div className={`mb-3 ${active ? "text-[#c9a96e]" : "text-[#888]"}`}>{method.icon}</div>
                        <p className="text-[11px] tracking-[0.15em] uppercase font-medium text-[#1a1a1a] mb-1">{method.label}</p>
                        <p className="text-[11px] text-[#888] font-light">{method.desc}</p>
                        {active && (
                          <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-[#c9a96e] flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <p className="text-[10px] tracking-[0.35em] uppercase text-[#c9a96e] mb-5 font-medium">Комментарий</p>
                <textarea
                  placeholder="Дополнительные пожелания..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  onFocus={() => setFocusedField("notes")}
                  onBlur={() => setFocusedField(null)}
                  rows={3}
                  className={`${inputClass} resize-none`}
                  style={focusedField === "notes" ? inputFocusStyle : inputStyle}
                />
              </div>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-[#faf7f4] p-8" style={{ border: "1px solid #e8e0d8" }}>
                <p className="text-[10px] tracking-[0.35em] uppercase text-[#c9a96e] mb-5 font-medium">Состав заказа</p>

                <div className="space-y-4 mb-6 max-h-52 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={item.productId} className="flex gap-3 items-start">
                      <div className="h-10 w-10 shrink-0 bg-white overflow-hidden" style={{ border: "1px solid #e8e0d8" }}>
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <svg viewBox="0 0 24 24" fill="none" stroke="#c9a96e" strokeWidth="1" className="w-4 h-4 opacity-40">
                              <rect x="3" y="3" width="18" height="18"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-light text-[#1a1a1a] leading-snug line-clamp-2">{item.name}</p>
                        <p className="text-[11px] text-[#888] font-light">× {item.quantity}</p>
                      </div>
                      <p className="text-[12px] font-light text-[#1a1a1a] shrink-0">
                        {(item.price * item.quantity).toLocaleString("ru-KZ")} ₸
                      </p>
                    </div>
                  ))}
                </div>

                {/* Delivery info */}
                <div className="py-3 mb-4 flex items-center gap-2" style={{ borderTop: "1px solid #e8e0d8", borderBottom: "1px solid #e8e0d8" }}>
                  {form.deliveryMethod === "pickup" ? (
                    <>
                      <Store className="h-3.5 w-3.5 text-[#c9a96e] shrink-0" />
                      <span className="text-[11px] text-[#888] font-light">
                        {PICKUP_LOCATIONS.find((l) => l.value === form.pickupLocation)?.label}
                      </span>
                    </>
                  ) : (
                    <>
                      <Truck className="h-3.5 w-3.5 text-[#c9a96e] shrink-0" />
                      <span className="text-[11px] text-[#888] font-light">Доставка курьером</span>
                    </>
                  )}
                </div>

                {/* Promo code */}
                <div className="mb-5">
                  {promo ? (
                    <div className="flex items-center justify-between gap-2 bg-white px-3 py-2.5" style={{ border: "1px solid #c9a96e" }}>
                      <span className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.15em] text-[#1a1a1a]">
                        <Tag className="h-3.5 w-3.5 text-[#c9a96e]" />
                        {promo.code.toUpperCase()} · −{promo.percent}%
                      </span>
                      <button
                        type="button"
                        onClick={() => { setAppliedPromo(null); setPromoInput(""); }}
                        className="p-1 text-[#888] hover:text-[#1a1a1a]"
                        aria-label="Убрать промокод"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Промокод"
                          value={promoInput}
                          onChange={(e) => { setPromoInput(e.target.value); setPromoError(""); }}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyPromo(); } }}
                          className={`${inputClass} uppercase tracking-[0.1em] min-w-0`}
                          style={inputStyle}
                        />
                        <button
                          type="button"
                          onClick={applyPromo}
                          disabled={promoChecking || !promoInput.trim()}
                          className="shrink-0 bg-[#1a1a1a] px-4 text-[10px] font-medium uppercase tracking-[0.15em] text-white transition-colors hover:bg-[#c9a96e] disabled:opacity-50"
                        >
                          {promoChecking ? "..." : "Применить"}
                        </button>
                      </div>
                      {promoError && <p className="mt-1.5 text-[11px] font-light text-red-400">{promoError}</p>}
                      <p className="mt-1.5 text-[10px] font-light text-[#888]">Промокод действует на первую покупку — проверим при подтверждении заказа.</p>
                    </>
                  )}
                </div>

                {/* Total */}
                {promo && (
                  <div className="mb-2 space-y-1">
                    <div className="flex justify-between text-[12px] font-light text-[#888]">
                      <span>Сумма</span>
                      <span>{totalAmount.toLocaleString("ru-KZ")} ₸</span>
                    </div>
                    <div className="flex justify-between text-[12px] font-light text-[#c9a96e]">
                      <span>Скидка {promo.percent}%</span>
                      <span>−{discount.toLocaleString("ru-KZ")} ₸</span>
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-baseline mb-6">
                  <span className="text-[11px] tracking-[0.15em] uppercase font-medium text-[#1a1a1a]">Итого</span>
                  <span className="font-serif text-2xl font-light text-[#1a1a1a]">
                    {payableTotal.toLocaleString("ru-KZ")} ₸
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={createOrder.isPending}
                  className="group w-full flex items-center justify-center gap-3 bg-[#1a1a1a] text-white py-4 text-[11px] tracking-[0.2em] uppercase font-medium hover:bg-[#c9a96e] disabled:opacity-60 transition-all duration-300"
                >
                  {createOrder.isPending ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Оформляем...
                    </span>
                  ) : (
                    <>
                      Подтвердить заказ
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
                    </>
                  )}
                </button>

                <Link href="/cart">
                  <button type="button" className="w-full py-3 text-[11px] tracking-[0.15em] uppercase font-light text-[#888] hover:text-[#1a1a1a] transition-colors duration-200 mt-2">
                    ← Вернуться в корзину
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
