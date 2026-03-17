import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, X, Send, Loader2, Bot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const WELCOME = "¡Hola! Soy el **Administrador Jesus** 👋\n\nEn qué te puedo ayudar. Indícame tus dudas y en breve serán respondidas por **Jesús Gil**.\n\nTambién puedo intentar responder preguntas frecuentes de inmediato.";

export default function ChatBubble({ user }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [aiTyping, setAiTyping] = useState(false);
  const [localMessages, setLocalMessages] = useState([
    { role: "ai", text: WELCOME, time: new Date() }
  ]);
  const bottomRef = useRef(null);
  const qc = useQueryClient();

  // Poll for admin replies to this user's messages
  const { data: mensajes = [] } = useQuery({
    queryKey: ["mensajesChat", user?.email],
    queryFn: () => base44.entities.MensajeChat.filter({ usuario_email: user?.email }, "-created_date", 50),
    enabled: !!user?.email && open,
    refetchInterval: 10000,
  });

  // Sync admin replies into local messages
  useEffect(() => {
    mensajes.forEach(m => {
      if (m.respondido && m.respuesta_admin) {
        const key = `admin-reply-${m.id}`;
        setLocalMessages(prev => {
          if (prev.find(p => p.key === key)) return prev;
          return [...prev, { role: "admin", text: m.respuesta_admin, time: new Date(m.updated_date || m.created_date), key }];
        });
      }
    });
  }, [mensajes]);

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.MensajeChat.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mensajesChat"] }),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages, open]);

  const handleSend = async () => {
    if (!text.trim()) return;
    const userMsg = text.trim();
    setText("");

    setLocalMessages(prev => [...prev, { role: "user", text: userMsg, time: new Date() }]);

    // Save to DB for admin
    saveMutation.mutate({
      usuario_email: user?.email || "anónimo",
      usuario_nombre: user?.full_name || user?.email || "Visitante",
      mensaje: userMsg,
      respondido: false,
      leido_admin: false,
    });

    // AI instant response
    setAiTyping(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Eres "Administrador Jesus", el asistente virtual del panel contable ContaControl. 
Responde de manera amable y profesional en español. 
Si la pregunta es sobre datos específicos del sistema que no conoces, di que Jesús Gil responderá pronto.
Si es una pregunta general de contabilidad, ayuda con tu conocimiento.
Pregunta del usuario: "${userMsg}"`,
      });
      setLocalMessages(prev => [...prev, { role: "ai", text: res, time: new Date() }]);
    } catch {
      setLocalMessages(prev => [...prev, { role: "ai", text: "Tu mensaje fue recibido. Jesús Gil te responderá a la brevedad. 🙏", time: new Date() }]);
    } finally {
      setAiTyping(false);
    }
  };

  const renderText = (t) =>
    t.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>");

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary shadow-lg shadow-primary/40 flex items-center justify-center text-white"
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><X className="w-6 h-6" /></motion.div>
            : <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><MessageCircle className="w-6 h-6" /></motion.div>
          }
        </AnimatePresence>
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-card rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden"
            style={{ maxHeight: "520px" }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-primary text-white">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold">Administrador Jesus</p>
                <p className="text-[10px] opacity-80">● En línea — ContaControl</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20" style={{ minHeight: 0 }}>
              {localMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role !== "user" && (
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                      <Bot className="w-3.5 h-3.5 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-white rounded-br-sm"
                        : msg.role === "admin"
                        ? "bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-bl-sm"
                        : "bg-card border border-border text-foreground rounded-bl-sm"
                    }`}
                    dangerouslySetInnerHTML={{ __html: renderText(msg.text) }}
                  />
                </div>
              ))}
              {aiTyping && (
                <div className="flex justify-start">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mr-2 flex-shrink-0">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 px-3 py-3 border-t border-border bg-card">
              <input
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Escribe tu pregunta..."
                className="flex-1 text-xs bg-muted rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30 border border-transparent"
              />
              <button
                onClick={handleSend}
                disabled={!text.trim() || aiTyping}
                className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center disabled:opacity-40 hover:bg-primary/90 transition-colors flex-shrink-0"
              >
                {aiTyping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}