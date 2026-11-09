import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";

export default function OrderConfirmation() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="pt-24 pb-16 min-h-screen bg-white flex items-center justify-center">
      <div className="max-w-lg mx-auto px-6 text-center">

        {/* Check icon */}
        <div className="animate-scale-in mb-8">
          <div
            className="w-20 h-20 mx-auto flex items-center justify-center"
            style={{ border: "1px solid #c9a96e" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="#c9a96e" strokeWidth="1.5" className="w-8 h-8">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <div className="animate-fade-in-up mb-8">
          <p className="text-[10px] tracking-[0.35em] uppercase text-[#c9a96e] mb-3 font-medium">Спасибо</p>
          <h1 className="font-serif text-3xl md:text-4xl font-light text-[#1a1a1a] tracking-wide mb-3">
            Заказ оформлен!
          </h1>
          <div className="w-10 h-px bg-[#c9a96e] mx-auto mb-5" />
          <p className="text-sm text-[#888] font-light leading-relaxed">
            Наш менеджер свяжется с вами в ближайшее время для подтверждения заказа.
            Ожидайте звонка или сообщения в WhatsApp.
          </p>
        </div>

        {/* Steps */}
        <div
          className="animate-fade-in-up bg-[#faf7f4] p-8 mb-8 text-left"
          style={{ border: "1px solid #e8e0d8", animationDelay: "150ms" }}
        >
          <p className="text-[10px] tracking-[0.35em] uppercase text-[#c9a96e] mb-5 font-medium text-center">
            Что дальше?
          </p>
          <div className="space-y-5">
            {[
              { step: "01", text: "Менеджер свяжется с вами для подтверждения заказа" },
              { step: "02", text: "Вы выбираете удобное время и способ получения" },
              { step: "03", text: "Получаете свои любимые средства ухода" },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4">
                <span
                  className="font-serif text-2xl font-light shrink-0 leading-none"
                  style={{ color: "#c9a96e" }}
                >
                  {item.step}
                </span>
                <p className="text-sm text-[#555] font-light leading-relaxed pt-1">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="animate-fade-in-up space-y-3" style={{ animationDelay: "250ms" }}>
          <a
            href="https://wa.me/77774779779"
            target="_blank"
            rel="noopener noreferrer"
            className="group w-full flex items-center justify-center gap-3 py-4 text-[11px] tracking-[0.2em] uppercase font-medium transition-all duration-300"
            style={{ background: "#25D366", color: "white" }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Написать в WhatsApp
          </a>

          <Link href="/catalog">
            <button className="group w-full flex items-center justify-center gap-3 border border-[#1a1a1a] text-[#1a1a1a] py-4 text-[11px] tracking-[0.2em] uppercase font-medium hover:bg-[#1a1a1a] hover:text-white transition-all duration-300">
              Продолжить покупки
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </Link>

          <Link href="/">
            <button className="w-full py-3 text-[11px] tracking-[0.15em] uppercase font-light text-[#888] hover:text-[#1a1a1a] transition-colors duration-200">
              На главную
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
