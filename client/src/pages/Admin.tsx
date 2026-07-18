import { useState, useRef } from "react";
import { Link } from "wouter";
import {
  Package, ShoppingBag, TrendingUp, AlertCircle,
  Plus, Pencil, Trash2, X, Check, Upload, ChevronDown,
  LogIn, LayoutDashboard, ClipboardList, RefreshCw,
  BarChart2, Star, EyeOff, Eye, Tag,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const CATEGORY_TREE: Record<string, string[]> = {
  "Уход за лицом": ["Кремы", "Сыворотки", "Тонеры", "Эссенции", "Маски", "Патчи", "Солнцезащита", "Масла", "Мисты", "Гели", "Уход за глазами", "Лосьоны", "Эмульсии", "Флюиды"],
  "Очищение": ["Гели для умывания", "Пенки для умывания", "Гидрофильные масла", "Мицеллярная вода", "Скрабы и пилинги", "Энзимные пудры"],
  "Макияж": ["Тональные средства", "Помады", "Блески для губ", "Тинты", "Бальзамы для губ", "Карандаши для губ", "Румяна", "Тени", "Туши", "Карандаши для глаз", "Консилеры", "Пудры", "Контуринг", "Пламперы", "Фиксаторы", "Масла для губ", "Для губ"],
  "Уход за телом": ["Лосьоны и кремы", "Гели для душа", "Кремы для рук", "Дезодоранты", "Скрабы для тела", "Зубные пасты", "Мыло"],
  "Уход за волосами": ["Шампуни", "Кондиционеры", "Маски для волос", "Масла", "Стайлинг", "Сыворотки для волос"],
  "Парфюмерия": ["Духи"],
  "Аксессуары": ["Аксессуары"],
  "Наборы": ["Наборы"],
  "Для дома": ["Ароматы для дома"],
  "Сертификаты": ["Сертификаты"],
  "Прочее": ["Прочее"],
};

const CATEGORY_LIST = Object.keys(CATEGORY_TREE);

const ORDER_STATUSES = [
  { value: "new", label: "Новый", color: "bg-blue-100 text-blue-700" },
  { value: "confirmed", label: "Подтверждён", color: "bg-yellow-100 text-yellow-700" },
  { value: "processing", label: "В обработке", color: "bg-orange-100 text-orange-700" },
  { value: "shipped", label: "Отправлен", color: "bg-purple-100 text-purple-700" },
  { value: "delivered", label: "Доставлен", color: "bg-green-100 text-green-700" },
  { value: "cancelled", label: "Отменён", color: "bg-red-100 text-red-700" },
];

const PAYMENT_LABELS: Record<string, string> = { kaspi_red: "Kaspi", cash: "Наличные" };
const DELIVERY_LABELS: Record<string, string> = { delivery: "Доставка", pickup: "Самовывоз" };

type Tab = "dashboard" | "products" | "orders" | "stats" | "featured";

const emptyForm = () => ({
  name: "", brand: "", category: "Уход за лицом", subcategory: "Кремы",
  description: "", ingredients: "", usage: "",
  price: "", imageUrl: "", inStock: 1,
  discountPrice: "", discountUntil: "",
});

// ── Форма входа ──────────────────────────────────────────────────────────────
function AdminLogin() {
  const [password, setPassword] = useState("");
  const utils = trpc.useUtils();
  const loginMutation = trpc.auth.adminLogin.useMutation({
    onSuccess: async () => { await utils.auth.me.invalidate(); toast.success("Вход выполнен!"); window.location.reload(); },
    onError: (e) => toast.error(e.message || "Неверный пароль"),
  });
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf7f4]">
      <div className="text-center max-w-sm mx-auto px-6 w-full">
        <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center border border-[#c9a96e]">
          <LogIn className="w-6 h-6 text-[#c9a96e]" />
        </div>
        <h1 className="font-serif text-2xl font-light text-[#1a1a1a] mb-2">Панель администратора</h1>
        <p className="text-sm text-[#888] font-light mb-8">Введите пароль для доступа</p>
        <form onSubmit={(e) => { e.preventDefault(); if (!password) { toast.error("Введите пароль"); return; } loginMutation.mutate({ password }); }} className="space-y-4">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль администратора"
            className="w-full border border-[#e8e0d8] px-4 py-3 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#c9a96e] bg-white transition-colors text-center" autoFocus />
          <button type="submit" disabled={loginMutation.isPending}
            className="w-full inline-flex items-center justify-center gap-2 bg-[#1a1a1a] text-white px-8 py-3 text-xs tracking-[0.2em] uppercase font-medium hover:bg-[#c9a96e] transition-colors duration-300 disabled:opacity-50">
            {loginMutation.isPending ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
            Войти
          </button>
        </form>
        <Link href="/" className="inline-block mt-6 text-xs tracking-[0.15em] uppercase text-[#c9a96e] hover:underline">← На главную</Link>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Admin() {
  const { user, loading, isAuthenticated } = useAuth();
  const [tab, setTab] = useState<Tab>("dashboard");

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf7f4]">
      <div className="w-8 h-8 border-2 border-[#c9a96e] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isAuthenticated || user?.role !== "admin") return <AdminLogin />;

  return (
    <div className="min-h-screen bg-[#faf7f4]">
      <div className="bg-white border-b border-[#e8e0d8] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#1a1a1a] flex items-center justify-center">
                <span className="text-white text-xs font-serif font-light tracking-widest">A</span>
              </div>
              <div>
                <p className="text-xs font-medium tracking-[0.1em] uppercase text-[#1a1a1a]">Amor Skincare</p>
                <p className="text-[10px] text-[#c9a96e] tracking-[0.05em]">Панель администратора</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-[#888] hidden sm:block">{user.name || "Администратор"}</span>
              <Link href="/" className="text-xs text-[#888] hover:text-[#1a1a1a] transition-colors">← Сайт</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-wrap gap-0 mb-6 bg-white border border-[#e8e0d8] w-fit overflow-hidden">
          {[
            { id: "dashboard" as Tab, label: "Обзор", icon: LayoutDashboard },
            { id: "products" as Tab, label: "Товары", icon: Package },
            { id: "orders" as Tab, label: "Заказы", icon: ClipboardList },
            { id: "featured" as Tab, label: "Акции", icon: Star },
            { id: "stats" as Tab, label: "Статистика", icon: BarChart2 },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-medium tracking-[0.1em] uppercase transition-all duration-200 border-r border-[#e8e0d8] last:border-r-0 ${tab === id ? "bg-[#1a1a1a] text-white" : "text-[#888] hover:text-[#1a1a1a] hover:bg-[#faf7f4]"}`}>
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {tab === "dashboard" && <DashboardTab />}
        {tab === "products" && <ProductsTab />}
        {tab === "orders" && <OrdersTab />}
        {tab === "featured" && <FeaturedTab />}
        {tab === "stats" && <StatsTab />}
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function DashboardTab() {
  const { data: stats, isLoading } = trpc.admin.stats.useQuery();
  const cards = [
    { label: "Товаров в каталоге", value: stats?.totalProducts ?? 0, icon: Package, accent: "text-blue-600" },
    { label: "Всего заказов", value: stats?.totalOrders ?? 0, icon: ShoppingBag, accent: "text-purple-600" },
    { label: "Новых заказов", value: stats?.newOrders ?? 0, icon: AlertCircle, accent: "text-orange-500" },
    { label: "Выручка (₸)", value: stats ? Math.round(stats.totalRevenue).toLocaleString("ru-KZ") : "—", icon: TrendingUp, accent: "text-green-600" },
  ];
  return (
    <div>
      <h2 className="font-serif text-2xl font-light text-[#1a1a1a] mb-6">Обзор</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white border border-[#e8e0d8] p-6">
            <card.icon className={`w-5 h-5 ${card.accent} mb-4`} />
            {isLoading ? <div className="h-8 w-16 bg-[#f5f0eb] animate-pulse rounded mb-1" /> : <p className="font-serif text-3xl font-light text-[#1a1a1a] mb-1">{card.value}</p>}
            <p className="text-xs text-[#888] font-light">{card.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-white border border-[#e8e0d8] p-6">
        <h3 className="font-serif text-lg font-light text-[#1a1a1a] mb-4">Инструкция</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { title: "Добавить товар", desc: "Перейдите во вкладку «Товары» → нажмите «+ Добавить товар» → заполните форму и загрузите фото" },
            { title: "Акции на главной", desc: "Вкладка «Акции» → выберите товар из каталога → укажите лейбл (Акция месяца, Хит и т.д.)" },
            { title: "Статистика", desc: "Вкладка «Статистика» — график посещений за 30 дней" },
          ].map((item) => (
            <div key={item.title} className="p-4 border border-[#e8e0d8] bg-[#faf7f4]">
              <p className="text-xs font-medium text-[#1a1a1a] mb-1.5">{item.title}</p>
              <p className="text-xs text-[#888] font-light leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Products ──────────────────────────────────────────────────────────────────
function ProductsTab() {
  const utils = trpc.useUtils();
  const { data: products = [], isLoading } = trpc.products.list.useQuery({});
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const createMutation = trpc.products.create.useMutation({
    onSuccess: () => { utils.products.list.invalidate(); toast.success("Товар добавлен!"); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.products.update.useMutation({
    onSuccess: () => { utils.products.list.invalidate(); toast.success("Товар обновлён!"); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.products.delete.useMutation({
    onSuccess: () => { utils.products.list.invalidate(); toast.success("Товар удалён"); setDeletingId(null); },
    onError: (e) => toast.error(e.message),
  });
  const toggleStockMutation = trpc.products.toggleStock.useMutation({
    onSuccess: () => { utils.products.list.invalidate(); toast.success("Наличие обновлено"); },
    onError: (e) => toast.error(e.message),
  });
  const uploadMutation = trpc.admin.uploadImage.useMutation({
    onError: (e) => toast.error("Ошибка загрузки: " + e.message),
  });

  function resetForm() {
    setForm(emptyForm()); setImagePreview(""); setEditingId(null); setShowForm(false);
  }

  function startEdit(p: typeof products[0]) {
    setForm({
      name: p.name, brand: p.brand,
      category: (p.category as string) || "Уход за лицом",
      subcategory: ((p as any).subcategory as string) || "",
      description: p.description ?? "", ingredients: p.ingredients ?? "",
      usage: p.usage ?? "", price: p.price?.toString() ?? "",
      imageUrl: p.imageUrl ?? "", inStock: p.inStock,
      discountPrice: (p as any).discountPrice?.toString() ?? "",
      discountUntil: (p as any).discountUntil ?? "",
    });
    setImagePreview(p.imageUrl ?? "");
    setEditingId(p.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleImageFile(file: File) {
    if (file.size > 5 * 1024 * 1024) { toast.error("Файл слишком большой (макс. 5 МБ)"); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64 = (e.target?.result as string).split(",")[1];
        const result = await uploadMutation.mutateAsync({ base64, filename: file.name, mimeType: file.type });
        setForm((f) => ({ ...f, imageUrl: result.url }));
        setImagePreview(result.url);
        toast.success("Фото загружено!");
      } finally { setUploading(false); }
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.brand || !form.price) { toast.error("Заполните обязательные поля"); return; }
    const data = {
      ...form,
      inStock: Number(form.inStock),
      discountPrice: form.discountPrice || null,
      discountUntil: form.discountUntil || null,
    };
    if (editingId) { await updateMutation.mutateAsync({ id: editingId, ...data } as any); }
    else { await createMutation.mutateAsync(data as any); }
  }

  // Проверяем активна ли скидка
  function isDiscountActive(p: any): boolean {
    if (!p.discountPrice || !p.discountUntil) return false;
    const [d, m, y] = p.discountUntil.split(".");
    const until = new Date(`20${y}-${m}-${d}`);
    return until >= new Date();
  }

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand.toLowerCase().includes(search.toLowerCase())
  );
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const availableSubcats = CATEGORY_TREE[form.category] || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-2xl font-light text-[#1a1a1a]">Товары</h2>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-[#1a1a1a] text-white px-5 py-2.5 text-xs tracking-[0.15em] uppercase font-medium hover:bg-[#c9a96e] transition-colors duration-200">
          <Plus className="w-3.5 h-3.5" /> Добавить товар
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-[#e8e0d8] mb-6">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e0d8] bg-[#faf7f4]">
            <h3 className="font-serif text-lg font-light text-[#1a1a1a]">{editingId ? "Редактировать товар" : "Новый товар"}</h3>
            <button onClick={resetForm} className="p-1.5 hover:bg-[#e8e0d8] rounded transition-colors"><X className="w-4 h-4 text-[#888]" /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {[
                  { label: "Название товара *", field: "name", placeholder: "Hydra Glow Serum" },
                  { label: "Бренд *", field: "brand", placeholder: "Biodance" },
                ].map(({ label, field, placeholder }) => (
                  <div key={field}>
                    <label className="block text-[10px] tracking-[0.2em] uppercase font-medium text-[#888] mb-1.5">{label}</label>
                    <input value={(form as any)[field]} onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full border border-[#e8e0d8] px-3 py-2.5 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#c9a96e] bg-white transition-colors"
                      required={field === "name" || field === "brand"} />
                  </div>
                ))}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] tracking-[0.2em] uppercase font-medium text-[#888] mb-1.5">Категория *</label>
                    <select value={form.category} onChange={(e) => { const newCat = e.target.value; const subs = CATEGORY_TREE[newCat] || []; setForm((f) => ({ ...f, category: newCat, subcategory: subs[0] || "" })); }}
                      className="w-full border border-[#e8e0d8] px-3 py-2.5 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#c9a96e] bg-white">
                      {CATEGORY_LIST.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-[0.2em] uppercase font-medium text-[#888] mb-1.5">Подкатегория</label>
                    <select value={form.subcategory} onChange={(e) => setForm((f) => ({ ...f, subcategory: e.target.value }))}
                      className="w-full border border-[#e8e0d8] px-3 py-2.5 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#c9a96e] bg-white">
                      {availableSubcats.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] tracking-[0.2em] uppercase font-medium text-[#888] mb-1.5">Цена (₸) *</label>
                    <input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                      placeholder="8900"
                      className="w-full border border-[#e8e0d8] px-3 py-2.5 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#c9a96e] bg-white" required />
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-[0.2em] uppercase font-medium text-[#888] mb-1.5">В наличии (кол-во)</label>
                    <input type="number" value={form.inStock} min={0} onChange={(e) => setForm((f) => ({ ...f, inStock: parseInt(e.target.value) || 0 }))}
                      className="w-full border border-[#e8e0d8] px-3 py-2.5 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#c9a96e] bg-white" />
                  </div>
                </div>

                {/* Скидка */}
                <div className="border border-[#e8e0d8] p-4 bg-[#faf7f4]">
                  <p className="text-[10px] tracking-[0.2em] uppercase font-medium text-[#c9a96e] mb-3 flex items-center gap-1.5">
                    <Tag className="w-3 h-3" /> Скидка (необязательно)
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] tracking-[0.15em] uppercase font-medium text-[#888] mb-1.5">Цена со скидкой (₸)</label>
                      <input type="number" value={form.discountPrice} onChange={(e) => setForm((f) => ({ ...f, discountPrice: e.target.value }))}
                        placeholder="6900"
                        className="w-full border border-[#e8e0d8] px-3 py-2.5 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#c9a96e] bg-white" />
                    </div>
                    <div>
                      <label className="block text-[10px] tracking-[0.15em] uppercase font-medium text-[#888] mb-1.5">Действует до (дд.мм.гг)</label>
                      <input type="text" value={form.discountUntil} onChange={(e) => setForm((f) => ({ ...f, discountUntil: e.target.value }))}
                        placeholder="31.12.26"
                        className="w-full border border-[#e8e0d8] px-3 py-2.5 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#c9a96e] bg-white" />
                    </div>
                  </div>
                  <p className="text-[10px] text-[#aaa] mt-2">Оставьте пустым если скидки нет. Старая цена будет зачёркнута автоматически.</p>
                </div>

                {[
                  { label: "Описание", field: "description", placeholder: "Описание товара...", rows: 3 },
                  { label: "Способ применения", field: "usage", placeholder: "Нанесите на очищенную кожу...", rows: 2 },
                  { label: "Состав (ингредиенты)", field: "ingredients", placeholder: "Water, Niacinamide...", rows: 2 },
                ].map(({ label, field, placeholder, rows }) => (
                  <div key={field}>
                    <label className="block text-[10px] tracking-[0.2em] uppercase font-medium text-[#888] mb-1.5">{label}</label>
                    <textarea value={(form as any)[field]} onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                      placeholder={placeholder} rows={rows}
                      className="w-full border border-[#e8e0d8] px-3 py-2.5 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#c9a96e] bg-white resize-none" />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-[10px] tracking-[0.2em] uppercase font-medium text-[#888] mb-1.5">Фото товара</label>
                <div className="relative border-2 border-dashed border-[#e8e0d8] bg-[#faf7f4] flex items-center justify-center cursor-pointer hover:border-[#c9a96e] transition-colors duration-200 mb-3" style={{ minHeight: "240px" }} onClick={() => fileRef.current?.click()}>
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="max-h-56 max-w-full object-contain p-4" />
                      <button type="button" onClick={(e) => { e.stopPropagation(); setImagePreview(""); setForm((f) => ({ ...f, imageUrl: "" })); }}
                        className="absolute top-2 right-2 bg-white border border-[#e8e0d8] rounded-full p-1 hover:bg-red-50 transition-colors">
                        <X className="w-3.5 h-3.5 text-[#888]" />
                      </button>
                    </>
                  ) : (
                    <div className="text-center p-8">
                      {uploading ? <div className="w-8 h-8 border-2 border-[#c9a96e] border-t-transparent rounded-full animate-spin mx-auto mb-3" /> : <Upload className="w-8 h-8 text-[#c9a96e] mx-auto mb-3" />}
                      <p className="text-sm text-[#888] font-light">{uploading ? "Загрузка..." : "Нажмите чтобы выбрать фото"}</p>
                      <p className="text-xs text-[#bbb] mt-1">JPG, PNG, WebP — до 5 МБ</p>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }} />
                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase font-medium text-[#888] mb-1.5">Или вставьте ссылку на фото</label>
                  <input value={form.imageUrl} onChange={(e) => { setForm((f) => ({ ...f, imageUrl: e.target.value })); setImagePreview(e.target.value); }}
                    placeholder="https://..."
                    className="w-full border border-[#e8e0d8] px-3 py-2.5 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#c9a96e] bg-white" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t border-[#e8e0d8]">
              <button type="submit" disabled={isSaving || uploading}
                className="flex items-center gap-2 bg-[#1a1a1a] text-white px-8 py-3 text-xs tracking-[0.15em] uppercase font-medium hover:bg-[#c9a96e] transition-colors duration-200 disabled:opacity-50">
                {isSaving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                {editingId ? "Сохранить изменения" : "Добавить товар"}
              </button>
              <button type="button" onClick={resetForm}
                className="px-6 py-3 text-xs tracking-[0.15em] uppercase font-medium border border-[#e8e0d8] text-[#888] hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors duration-200">
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mb-4">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск по названию или бренду..."
          className="w-full sm:w-80 border border-[#e8e0d8] px-4 py-2.5 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#c9a96e] bg-white transition-colors" />
      </div>

      <div className="bg-white border border-[#e8e0d8] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e8e0d8] bg-[#faf7f4]">
                {["Фото", "Название", "Бренд", "Цена", "Наличие", "Действия"].map((h, i) => (
                  <th key={h} className={`text-left px-4 py-3 text-[10px] tracking-[0.2em] uppercase font-medium text-[#888] ${i === 0 ? "w-16" : ""} ${i === 2 ? "hidden sm:table-cell" : ""} ${i === 5 ? "text-right" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#f5f0eb]">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-[#f5f0eb] animate-pulse rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-[#888] font-light">{search ? "Ничего не найдено" : "Товаров пока нет"}</td></tr>
              ) : filtered.slice(0, 100).map((p) => {
                const hasDiscount = isDiscountActive(p as any);
                return (
                  <tr key={p.id} className="border-b border-[#f5f0eb] hover:bg-[#faf7f4] transition-colors">
                    <td className="px-4 py-3">
                      {p.imageUrl
                        ? <img src={p.imageUrl} alt={p.name} className="w-12 h-12 object-cover bg-[#f5f0eb]" />
                        : <div className="w-12 h-12 bg-[#f5f0eb] flex items-center justify-center"><Package className="w-4 h-4 text-[#ccc]" /></div>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-[#1a1a1a] line-clamp-1">{p.name}</p>
                      {hasDiscount && <span className="text-[10px] text-white bg-red-500 px-1.5 py-0.5 mt-0.5 inline-block">СКИДКА</span>}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell"><p className="text-xs text-[#888]">{p.brand}</p></td>
                    <td className="px-4 py-3">
                      {hasDiscount ? (
                        <div>
                          <p className="text-xs text-[#aaa] line-through">{Number(p.price).toLocaleString("ru-KZ")} ₸</p>
                          <p className="text-sm font-medium text-red-600">{Number((p as any).discountPrice).toLocaleString("ru-KZ")} ₸</p>
                        </div>
                      ) : (
                        <p className="text-sm font-medium text-[#1a1a1a]">{Number(p.price).toLocaleString("ru-KZ")} ₸</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {/* Кнопка убрать/вернуть из наличия */}
                      <button
                        onClick={() => toggleStockMutation.mutate({ id: p.id, inStock: p.inStock > 0 ? 0 : 1 })}
                        title={p.inStock > 0 ? "Убрать из наличия" : "Вернуть в наличие"}
                        className={`flex items-center gap-1.5 text-xs px-2.5 py-1 transition-colors ${p.inStock > 0 ? "bg-green-50 text-green-700 hover:bg-red-50 hover:text-red-600" : "bg-red-50 text-red-600 hover:bg-green-50 hover:text-green-700"}`}>
                        {p.inStock > 0 ? <><Eye className="w-3 h-3" /> В наличии</> : <><EyeOff className="w-3 h-3" /> Нет</>}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => startEdit(p)} className="p-2 hover:bg-[#f5f0eb] transition-colors rounded" title="Редактировать">
                          <Pencil className="w-3.5 h-3.5 text-[#888]" />
                        </button>
                        {deletingId === p.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => deleteMutation.mutate({ id: p.id })} className="p-2 hover:bg-red-50 transition-colors rounded"><Check className="w-3.5 h-3.5 text-red-500" /></button>
                            <button onClick={() => setDeletingId(null)} className="p-2 hover:bg-[#f5f0eb] transition-colors rounded"><X className="w-3.5 h-3.5 text-[#888]" /></button>
                          </div>
                        ) : (
                          <button onClick={() => setDeletingId(p.id)} className="p-2 hover:bg-red-50 transition-colors rounded" title="Удалить">
                            <Trash2 className="w-3.5 h-3.5 text-[#888]" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-[#e8e0d8] bg-[#faf7f4]">
            <p className="text-xs text-[#888]">{filtered.length} товаров</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Featured (Акции на главной) ───────────────────────────────────────────────
function FeaturedTab() {
  const utils = trpc.useUtils();
  const { data: featured = [], isLoading } = trpc.featured.list.useQuery();
  const { data: products = [] } = trpc.products.list.useQuery({});
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [label, setLabel] = useState("Акция месяца");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");

  const addMutation = trpc.featured.add.useMutation({
    onSuccess: () => { utils.featured.list.invalidate(); toast.success("Добавлено!"); setSelectedProductId(null); setLabel("Акция месяца"); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.featured.update.useMutation({
    onSuccess: () => { utils.featured.list.invalidate(); toast.success("Обновлено!"); setEditingId(null); },
    onError: (e) => toast.error(e.message),
  });
  const removeMutation = trpc.featured.remove.useMutation({
    onSuccess: () => { utils.featured.list.invalidate(); toast.success("Удалено из акций"); },
    onError: (e) => toast.error(e.message),
  });

  const LABELS = ["Акция месяца", "Хит продаж", "Новинка", "Рекомендуем", "Специальное предложение"];

  return (
    <div>
      <h2 className="font-serif text-2xl font-light text-[#1a1a1a] mb-6">Акции на главной странице</h2>

      {/* Форма добавления */}
      <div className="bg-white border border-[#e8e0d8] p-6 mb-6">
        <h3 className="text-xs tracking-[0.2em] uppercase font-medium text-[#888] mb-4">Добавить товар в акции</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] tracking-[0.15em] uppercase font-medium text-[#888] mb-1.5">Выберите товар</label>
            <select value={selectedProductId ?? ""} onChange={(e) => setSelectedProductId(Number(e.target.value) || null)}
              className="w-full border border-[#e8e0d8] px-3 py-2.5 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#c9a96e] bg-white">
              <option value="">— Выберите товар —</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.brand})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] tracking-[0.15em] uppercase font-medium text-[#888] mb-1.5">Лейбл</label>
            <select value={label} onChange={(e) => setLabel(e.target.value)}
              className="w-full border border-[#e8e0d8] px-3 py-2.5 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#c9a96e] bg-white">
              {LABELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={() => { if (!selectedProductId) { toast.error("Выберите товар"); return; } addMutation.mutate({ productId: selectedProductId, label, sortOrder: featured.length }); }}
              disabled={addMutation.isPending}
              className="w-full flex items-center justify-center gap-2 bg-[#1a1a1a] text-white px-5 py-2.5 text-xs tracking-[0.15em] uppercase font-medium hover:bg-[#c9a96e] transition-colors disabled:opacity-50">
              <Plus className="w-3.5 h-3.5" /> Добавить
            </button>
          </div>
        </div>
      </div>

      {/* Список акционных товаров */}
      <div className="bg-white border border-[#e8e0d8] overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-[#c9a96e] border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : featured.length === 0 ? (
          <div className="p-12 text-center">
            <Star className="w-8 h-8 text-[#ddd] mx-auto mb-3" />
            <p className="text-sm text-[#888] font-light">Нет акционных товаров. Добавьте товар выше.</p>
          </div>
        ) : (
          <div>
            {featured.map((fp: any, idx: number) => (
              <div key={fp.id} className={`flex items-center gap-4 px-5 py-4 ${idx < featured.length - 1 ? "border-b border-[#f5f0eb]" : ""} hover:bg-[#faf7f4] transition-colors`}>
                {fp.product?.imageUrl
                  ? <img src={fp.product.imageUrl} alt={fp.product.name} className="w-14 h-14 object-cover bg-[#f5f0eb] flex-shrink-0" />
                  : <div className="w-14 h-14 bg-[#f5f0eb] flex items-center justify-center flex-shrink-0"><Package className="w-5 h-5 text-[#ccc]" /></div>
                }
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1a1a1a] truncate">{fp.product?.name}</p>
                  <p className="text-xs text-[#888]">{fp.product?.brand}</p>
                  {editingId === fp.id ? (
                    <div className="flex items-center gap-2 mt-2">
                      <select value={editLabel} onChange={(e) => setEditLabel(e.target.value)}
                        className="border border-[#e8e0d8] px-2 py-1 text-xs focus:outline-none focus:border-[#c9a96e] bg-white">
                        {LABELS.map((l) => <option key={l} value={l}>{l}</option>)}
                      </select>
                      <button onClick={() => updateMutation.mutate({ id: fp.id, label: editLabel })}
                        className="p-1 bg-[#1a1a1a] text-white rounded hover:bg-[#c9a96e] transition-colors">
                        <Check className="w-3 h-3" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-1 border border-[#e8e0d8] rounded hover:bg-[#f5f0eb] transition-colors">
                        <X className="w-3 h-3 text-[#888]" />
                      </button>
                    </div>
                  ) : (
                    <span className="inline-block mt-1 text-[10px] bg-[#c9a96e] text-white px-2 py-0.5">{fp.label}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => { setEditingId(fp.id); setEditLabel(fp.label); }}
                    className="p-2 hover:bg-[#f5f0eb] rounded transition-colors" title="Изменить лейбл">
                    <Pencil className="w-3.5 h-3.5 text-[#888]" />
                  </button>
                  <button onClick={() => removeMutation.mutate({ id: fp.id })}
                    className="p-2 hover:bg-red-50 rounded transition-colors" title="Убрать из акций">
                    <Trash2 className="w-3.5 h-3.5 text-[#888] hover:text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Stats ─────────────────────────────────────────────────────────────────────
function StatsTab() {
  const { data: visits = [], isLoading } = trpc.admin.getVisits.useQuery();
  const total = visits.reduce((sum: number, v: any) => sum + v.count, 0);
  const chartData = [...visits].reverse().map((v: any) => ({
    date: v.date.slice(5),
    визиты: v.count,
  }));

  return (
    <div>
      <h2 className="font-serif text-2xl font-light text-[#1a1a1a] mb-6">Статистика посещений</h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-[#e8e0d8] p-6">
          <BarChart2 className="w-5 h-5 text-[#c9a96e] mb-4" />
          {isLoading ? <div className="h-8 w-20 bg-[#f5f0eb] animate-pulse rounded" /> : <p className="font-serif text-3xl font-light text-[#1a1a1a]">{total.toLocaleString("ru-KZ")}</p>}
          <p className="text-xs text-[#888] font-light mt-1">Всего за 30 дней</p>
        </div>
        <div className="bg-white border border-[#e8e0d8] p-6">
          <TrendingUp className="w-5 h-5 text-[#c9a96e] mb-4" />
          {isLoading ? <div className="h-8 w-20 bg-[#f5f0eb] animate-pulse rounded" /> : <p className="font-serif text-3xl font-light text-[#1a1a1a]">{visits[0]?.count ?? 0}</p>}
          <p className="text-xs text-[#888] font-light mt-1">Сегодня</p>
        </div>
      </div>

      <div className="bg-white border border-[#e8e0d8] p-6">
        <h3 className="text-xs tracking-[0.2em] uppercase font-medium text-[#888] mb-6">Посещения за 30 дней</h3>
        {isLoading ? (
          <div className="h-48 bg-[#f5f0eb] animate-pulse rounded" />
        ) : chartData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-sm text-[#888]">Данных пока нет — они появятся когда посетители зайдут на сайт</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#888" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#888" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ border: "1px solid #e8e0d8", borderRadius: 0, fontSize: 12 }} />
              <Bar dataKey="визиты" fill="#c9a96e" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

// ── Orders ────────────────────────────────────────────────────────────────────
function OrdersTab() {
  const utils = trpc.useUtils();
  const { data: orders = [], isLoading, refetch } = trpc.orders.list.useQuery();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const updateStatus = trpc.orders.updateStatus.useMutation({
    onSuccess: () => { utils.orders.list.invalidate(); toast.success("Статус обновлён"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteOrderMutation = trpc.orders.delete.useMutation({
    onSuccess: () => { utils.orders.list.invalidate(); toast.success("Заказ удалён"); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-2xl font-light text-[#1a1a1a]">Заказы</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#888] bg-white border border-[#e8e0d8] px-3 py-1.5">{orders.length} заказов</span>
          <button onClick={() => refetch()} className="p-2 bg-white border border-[#e8e0d8] hover:border-[#c9a96e] transition-colors" title="Обновить">
            <RefreshCw className="w-3.5 h-3.5 text-[#888]" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
        {ORDER_STATUSES.map((s) => {
          const count = orders.filter((o) => o.status === s.value).length;
          return (
            <div key={s.value} className="bg-white border border-[#e8e0d8] p-3 text-center">
              <p className="font-serif text-xl font-light text-[#1a1a1a]">{count}</p>
              <p className="text-[10px] text-[#888] mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-white border border-[#e8e0d8] animate-pulse" />)}</div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-[#e8e0d8] p-16 text-center">
          <ShoppingBag className="w-10 h-10 text-[#ddd] mx-auto mb-4" />
          <p className="text-sm text-[#888] font-light">Заказов пока нет</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => {
            const statusInfo = ORDER_STATUSES.find((s) => s.value === order.status);
            const isExpanded = expandedId === order.id;
            const items = (order.items as any[]) || [];
            return (
              <div key={order.id} className="bg-white border border-[#e8e0d8] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-[#faf7f4] transition-colors" onClick={() => setExpandedId(isExpanded ? null : order.id)}>
                  <div>
                    <p className="text-sm font-medium text-[#1a1a1a]">#{order.id} — {order.customerName}</p>
                    <p className="text-xs text-[#888] mt-0.5">{order.customerPhone} · {new Date(order.createdAt).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-medium text-[#1a1a1a] hidden sm:block">{Number(order.totalAmount).toLocaleString("ru-KZ")} ₸</p>
                    <span className={`text-xs px-2.5 py-1 font-medium ${statusInfo?.color ?? "bg-gray-100 text-gray-600"}`}>{statusInfo?.label ?? order.status}</span>
                    <ChevronDown className={`w-4 h-4 text-[#888] transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                    <button onClick={(e) => { e.stopPropagation(); if (window.confirm(`Удалить заказ #${order.id}?`)) deleteOrderMutation.mutate({ id: order.id }); }}
                      className="p-1.5 hover:bg-red-50 rounded transition-colors ml-1" title="Удалить заказ">
                      <Trash2 className="w-3.5 h-3.5 text-[#ddd] hover:text-red-400 transition-colors" />
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t border-[#e8e0d8] px-5 py-5 bg-[#faf7f4]">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <p className="text-[10px] tracking-[0.2em] uppercase font-medium text-[#888] mb-3">Информация</p>
                        <div className="space-y-2 text-sm">
                          {[
                            ["Клиент", order.customerName],
                            ["Телефон", order.customerPhone, true],
                            ["Получение", DELIVERY_LABELS[order.deliveryMethod] ?? order.deliveryMethod],
                            ...(order.deliveryMethod === "pickup" && order.pickupLocation ? [["Магазин", order.pickupLocation]] : []),
                            ...(order.deliveryMethod === "delivery" && order.deliveryAddress ? [["Адрес", order.deliveryAddress]] : []),
                            ["Оплата", PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod],
                          ].map(([label, value, isPhone]: any) => (
                            <div key={label} className="flex justify-between">
                              <span className="text-[#888] font-light">{label}</span>
                              {isPhone ? <a href={`tel:${value}`} className="text-[#c9a96e] hover:underline">{value}</a> : <span className="text-[#1a1a1a] text-right max-w-[200px]">{value}</span>}
                            </div>
                          ))}
                          <div className="flex justify-between font-medium pt-2 border-t border-[#e8e0d8]">
                            <span className="text-[#888]">Итого</span>
                            <span className="text-[#1a1a1a]">{Number(order.totalAmount).toLocaleString("ru-KZ")} ₸</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] tracking-[0.2em] uppercase font-medium text-[#888] mb-3">Состав заказа</p>
                        <div className="space-y-2">
                          {items.map((item: any, i: number) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span className="text-[#1a1a1a] font-light">{item.name} × {item.quantity}</span>
                              <span className="text-[#888]">{(item.price * item.quantity).toLocaleString("ru-KZ")} ₸</span>
                            </div>
                          ))}
                        </div>
                        {order.notes && <div className="mt-3 pt-3 border-t border-[#e8e0d8]"><p className="text-xs text-[#888] font-light">📝 {order.notes}</p></div>}
                        <div className="mt-4 pt-4 border-t border-[#e8e0d8]">
                          <p className="text-[10px] tracking-[0.2em] uppercase font-medium text-[#888] mb-3">Обновить статус</p>
                          <div className="flex flex-wrap gap-2">
                            {ORDER_STATUSES.map((s) => (
                              <button key={s.value} onClick={() => updateStatus.mutate({ id: order.id, status: s.value as any })}
                                disabled={order.status === s.value || updateStatus.isPending}
                                className={`px-3 py-1.5 text-xs font-medium transition-all duration-200 ${order.status === s.value ? s.color + " ring-1 ring-current" : "bg-white border border-[#e8e0d8] text-[#888] hover:border-[#1a1a1a] hover:text-[#1a1a1a]"} disabled:opacity-50`}>
                                {s.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
