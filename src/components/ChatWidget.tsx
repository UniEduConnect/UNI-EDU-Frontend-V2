import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { sendSupportChat } from "@/services/chat";

interface Message {
  id: number;
  text: string;
  sender: "bot" | "user";
  time: string;
}

const initialMessages: Message[] = [
  {
    id: 1,
    text: "Xin chào! 👋 Tôi là trợ lý AI của UNI EDU. Tôi có thể giúp bạn tìm gia sư, giải đáp thắc mắc về khóa học, hoặc hỗ trợ đăng ký. Bạn cần giúp gì?",
    sender: "bot",
    time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
  },
];

const quickReplies = [
  "Tìm gia sư Toán",
  "Cách đăng ký",
  "Bảng giá",
];

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Monotonic id source — Date.now() collides when two messages land in the same ms (duplicate React keys).
  const nextId = useRef(initialMessages.length + 1);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const nowTime = () => new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { id: nextId.current++, text: text.trim(), sender: "user", time: nowTime() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await sendSupportChat(text.trim());
      setMessages((prev) => [...prev, { id: nextId.current++, text: res.reply, sender: "bot", time: nowTime() }]);
    } catch {
      setMessages((prev) => [...prev, { id: nextId.current++, text: "Xin lỗi, mình chưa kết nối được lúc này. Bạn thử lại sau nhé!", sender: "bot", time: nowTime() }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-neon text-neon-foreground shadow-neon flex items-center justify-center hover:scale-110 transition-transform"
          >
            <MessageCircle className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-background" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] bg-card rounded-3xl shadow-elevated border border-border flex flex-col overflow-hidden"
            style={{ height: "520px" }}
          >
            {/* Header — dark-blue gradient so the white text stays readable
                (the shared `gradient-hero` utility is a light gradient and washed it out). */}
            <div
              className="p-4 flex items-center gap-3"
              style={{ background: "linear-gradient(135deg, hsl(var(--deep-blue)) 0%, hsl(var(--neon)) 100%)" }}
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-deep-blue" />
              </div>
              <div className="flex-1">
                <div className="text-white font-semibold text-sm">UNI EDU AI</div>
                <div className="text-white/80 text-xs">Online · Phản hồi ngay</div>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  }`}>
                    <p>{msg.text}</p>
                    <span className={`text-[10px] mt-1 block ${msg.sender === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      {msg.time}
                    </span>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick replies */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2 flex gap-2 flex-wrap">
                {quickReplies.map((qr) => (
                  <button
                    key={qr}
                    onClick={() => sendMessage(qr)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border text-foreground hover:bg-muted transition-colors font-medium"
                  >
                    {qr}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-border">
              <form
                onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-neon/30 transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="w-10 h-10 rounded-xl bg-neon text-neon-foreground flex items-center justify-center hover:bg-neon/90 transition-colors disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatWidget;
