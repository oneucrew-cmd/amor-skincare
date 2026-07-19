import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Lock, Save } from "lucide-react";

export default function StatsEditor() {
  const { data: visits = [], isLoading, refetch } = trpc.admin.getVisits.useQuery();
  const [editing, setEditing] = useState<Record<string, number>>({});

  const setVisits = trpc.admin.setVisits.useMutation({
    onSuccess: () => { toast.success("Сохранено"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  function handleChange(date: string, value: string) {
    setEditing((prev) => ({ ...prev, [date]: parseInt(value) || 0 }));
  }

  async function handleSave(date: string) {
    const count = editing[date] ?? visits.find((v: any) => v.date === date)?.count ?? 0;
    await setVisits.mutateAsync({ date, count });
  }

  // Добавить новую дату
  const [newDate, setNewDate] = useState("");
  const [newCount, setNewCount] = useState("");

  async function handleAdd() {
    if (!newDate || !newCount) { toast.error("Заполните дату и количество"); return; }
    await setVisits.mutateAsync({ date: newDate, count: parseInt(newCount) });
    setNewDate(""); setNewCount("");
  }

  return (
    <div className="min-h-screen bg-[#faf7f4] py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-[#1a1a1a] flex items-center justify-center">
            <Lock className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-light text-[#1a1a1a]">Редактор статистики</h1>
            <p className="text-xs text-[#888]">Скрытая страница — только для администратора</p>
          </div>
        </div>

        {/* Добавить / изменить запись */}
        <div className="bg-white border border-[#e8e0d8] p-6 mb-6">
          <p className="text-[10px] tracking-[0.2em] uppercase font-medium text-[#888] mb-4">Добавить или изменить дату</p>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[10px] text-[#888] mb-1">Дата (ГГГГ-ММ-ДД)</label>
              <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)}
                className="w-full border border-[#e8e0d8] px-3 py-2 text-sm focus:outline-none focus:border-[#c9a96e]" />
            </div>
            <div className="w-32">
              <label className="block text-[10px] text-[#888] mb-1">Количество</label>
              <input type="number" value={newCount} onChange={(e) => setNewCount(e.target.value)}
                placeholder="150"
                className="w-full border border-[#e8e0d8] px-3 py-2 text-sm focus:outline-none focus:border-[#c9a96e]" />
            </div>
            <div className="flex items-end">
              <button onClick={handleAdd} disabled={setVisits.isPending}
                className="flex items-center gap-2 bg-[#1a1a1a] text-white px-4 py-2 text-xs tracking-[0.1em] uppercase hover:bg-[#c9a96e] transition-colors disabled:opacity-50">
                <Save className="w-3.5 h-3.5" /> Сохранить
              </button>
            </div>
          </div>
        </div>

        {/* Список */}
        <div className="bg-white border border-[#e8e0d8] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e8e0d8] bg-[#faf7f4]">
            <p className="text-[10px] tracking-[0.2em] uppercase font-medium text-[#888]">Последние 30 дней</p>
          </div>
          {isLoading ? (
            <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-[#c9a96e] border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : visits.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#888]">Данных пока нет</div>
          ) : (
            visits.map((v: any) => (
              <div key={v.date} className="flex items-center gap-4 px-6 py-3 border-b border-[#f5f0eb] last:border-0 hover:bg-[#faf7f4] transition-colors">
                <span className="text-sm text-[#888] font-light w-32">{v.date}</span>
                <input
                  type="number"
                  defaultValue={v.count}
                  onChange={(e) => handleChange(v.date, e.target.value)}
                  className="w-28 border border-[#e8e0d8] px-3 py-1.5 text-sm focus:outline-none focus:border-[#c9a96e]"
                />
                <button onClick={() => handleSave(v.date)} disabled={setVisits.isPending}
                  className="flex items-center gap-1.5 text-xs text-[#c9a96e] hover:text-[#1a1a1a] transition-colors disabled:opacity-50">
                  <Save className="w-3.5 h-3.5" /> Сохранить
                </button>
              </div>
            ))
          )}
        </div>

        <p className="text-center text-xs text-[#bbb] mt-6">
          Эта страница не отображается нигде на сайте. Адрес: <code className="bg-[#f5f0eb] px-1">/admin/x7k2-stats</code>
        </p>
      </div>
    </div>
  );
}
