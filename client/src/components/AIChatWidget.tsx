import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

const LOGO_URL = "https://pub-27e0df6017d045e4ab1d84e9030feb63.r2.dev/logo%20hq.png";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content: "Привет! Я AI-помощник Amor Skincare. Помогу подобрать уход для вашей кожи, расскажу о наших брендах и товарах. Чем могу помочь?",
};

const QUICK_QUESTIONS = [
  "Что подойдёт для сухой кожи?",
  "Расскажи о бренде Biodance",
  "Адреса магазинов",
  "Как оформить заказ?",
];

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const chatMutation = trpc.chat.message.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
      setIsTyping(false);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Извините, произошла ошибка. Напишите нам в WhatsApp: wa.me/77774779779",
        },
      ]);
      setIsTyping(false);
    },
  });

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = (text: string) => {
    const content = text.trim();
    if (!content || isTyping) return;
    const userMessage: Message = { role: "user", content };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsTyping(true);
    chatMutation.mutate({ messages: newMessages });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 md:right-6 z-50 w-[340px] md:w-[380px] animate-scale-in">
          <div
            className="bg-white overflow-hidden flex flex-col"
            style={{
              height: "500px",
              maxHeight: "calc(100vh - 120px)",
              border: "1px solid #e8e0d8",
              boxShadow: "0 24px 60px rgba(0,0,0,0.12)",
            }}
          >
            {/* Header */}
            <div className="px-5 py-4 flex items-center gap-3 bg-[#1a1a1a]">
              <div className="relative">
                <img
                  src={LOGO_URL}
                  alt="Amor"
                  className="h-9 w-9 rounded-full object-contain bg-white"
                  style={{ outline: "1px solid rgba(255,255,255,0.2)" }}
                />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#4ade80] border-2 border-[#1a1a1a]" />
              </div>
              <div className="flex-1">
                <p className="text-white text-[11px] tracking-[0.2em] uppercase font-medium">Amor Skincare</p>
                <p className="text-white/50 text-[10px] tracking-wide font-light">AI-помощник • Онлайн</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="h-7 w-7 flex items-center justify-center text-white/50 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#faf7f4]">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
                >
                  {msg.role === "assistant" && (
                    <img
                      src={LOGO_URL}
                      alt=""
                      className="h-6 w-6 rounded-full object-contain bg-white mr-2 shrink-0 mt-0.5"
                      style={{ border: "1px solid #e8e0d8" }}
                    />
                  )}
                  <div
                    className="max-w-[80%] px-3.5 py-2.5 text-[13px] leading-relaxed font-light"
                    style={
                      msg.role === "user"
                        ? {
                            background: "#1a1a1a",
                            color: "white",
                            borderRadius: "1rem 1rem 0.25rem 1rem",
                          }
                        : {
                            background: "white",
                            color: "#1a1a1a",
                            border: "1px solid #e8e0d8",
                            borderRadius: "1rem 1rem 1rem 0.25rem",
                          }
                    }
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start animate-fade-in">
                  <img
                    src={LOGO_URL}
                    alt=""
                    className="h-6 w-6 rounded-full object-contain bg-white mr-2 shrink-0"
                    style={{ border: "1px solid #e8e0d8" }}
                  />
                  <div
                    className="px-4 py-3"
                    style={{
                      background: "white",
                      border: "1px solid #e8e0d8",
                      borderRadius: "1rem 1rem 1rem 0.25rem",
                    }}
                  >
                    <div className="flex gap-1">
                      {[0, 150, 300].map((delay) => (
                        <div
                          key={delay}
                          className="h-1.5 w-1.5 rounded-full bg-[#c9a96e] animate-bounce"
                          style={{ animationDelay: `${delay}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick questions */}
            {messages.length <= 1 && (
              <div className="px-3 pb-2 bg-[#faf7f4]">
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="px-3 py-1.5 text-[11px] tracking-wide font-light transition-all duration-200 hover:bg-[#1a1a1a] hover:text-white"
                      style={{ border: "1px solid #e8e0d8", color: "#1a1a1a", background: "white" }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-3 bg-white" style={{ borderTop: "1px solid #e8e0d8" }}>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Напишите сообщение..."
                  disabled={isTyping}
                  className="flex-1 px-4 py-2.5 text-[13px] font-light focus:outline-none disabled:opacity-50 transition-all bg-[#faf7f4]"
                  style={{ border: "1px solid #e8e0d8" }}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="h-10 w-10 flex items-center justify-center disabled:opacity-40 transition-all hover:scale-105 active:scale-95"
                  style={{ background: "#1a1a1a" }}
                >
                  {isTyping ? (
                    <Loader2 className="h-4 w-4 text-white animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 text-white" />
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-4 md:right-6 z-50 h-14 w-14 flex items-center justify-center text-white transition-all duration-300 hover:scale-110 active:scale-95"
        style={{
          background: "#1a1a1a",
          boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
        }}
        aria-label="Открыть чат"
      >
        {isOpen ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        {!isOpen && (
          <span
            className="absolute -top-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center"
            style={{ background: "#c9a96e", border: "2px solid white" }}
          >
            <span className="text-[8px] font-bold text-white leading-none">AI</span>
          </span>
        )}
      </button>
    </>
  );
}
