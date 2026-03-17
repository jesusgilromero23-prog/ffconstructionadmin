import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, User, Bot, Clock } from "lucide-react";
import { format } from "date-fns";

export default function ChatConversationPanel({ mensajes }) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState("");
  const bottomRef = useRef(null);

  // Group messages by user
  const byUser = {};
  mensajes.forEach(m => {
    if (!byUser[m.usuario_email]) byUser[m.usuario_email] = { nombre: m.usuario_nombre, email: m.usuario_email, msgs: [] };
    byUser[m.usuario_email].msgs.push(m);
  });
  const threads = Object.values(byUser).sort((a, b) => {
    const lastA = a.msgs[a.msgs.length - 1];
    const lastB = b.msgs[b.msgs.length - 1];
    return new Date(lastB.created_date) - new Date(lastA.created_date);
  });

  const updateMensaje = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MensajeChat.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mensajesAdmin"] }),
  });

  const selectedThread = selected ? byUser[selected] : null;

  // Find last unanswered message for selected thread
  const lastUnanswered = selectedThread?.msgs.filter(m => !m.respondido).slice(-1)[0];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedThread]);

  const handleSend = () => {
    if (!reply.trim() || !lastUnanswered) return;
    updateMensaje.mutate({
      id: lastUnanswered.id,
      data: { respuesta_admin: reply.trim(), respondido: true, leido_admin: true }
    });
    setReply("");
  };

  return (
    <div className="flex h-[560px] rounded-xl border border-border overflow-hidden bg-card">
      {/* Thread List */}
      <div className="w-64 flex-shrink-0 border-r border-border bg-muted/20 overflow-y-auto">
        {threads.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground p-4 text-center">
            No hay mensajes aún.
          </div>
        ) : (
          threads.map(t => {
            const unread = t.msgs.filter(m => !m.leido_admin).length;
            const last = t.msgs[t.msgs.length - 1];
            return (
              <button
                key={t.email}
                onClick={() => setSelected(t.email)}
                className={`w-full text-left px-4 py-3 border-b border-border/50 hover:bg-muted/50 transition-colors ${selected === t.email ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold truncate">{t.nombre || t.email}</p>
                  {unread > 0 && (
                    <span className="bg-primary text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0">{unread}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{last.mensaje}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {last.created_date ? format(new Date(last.created_date), "dd/MM HH:mm") : ""}
                </p>
              </button>
            );
          })
        )}
      </div>

      {/* Conversation View */}
      {selectedThread ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border bg-card flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">{selectedThread.nombre}</p>
              <p className="text-xs text-muted-foreground">{selectedThread.email}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/10">
            {selectedThread.msgs.map(m => (
              <React.Fragment key={m.id}>
                {/* User message */}
                <div className="flex justify-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <div className="max-w-[75%]">
                    <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-3 py-2 text-xs text-foreground leading-relaxed">
                      {m.mensaje}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 ml-1">
                      {m.created_date ? format(new Date(m.created_date), "dd/MM HH:mm") : ""}
                    </p>
                  </div>
                </div>
                {/* Admin reply */}
                {m.respuesta_admin && (
                  <div className="flex justify-end gap-2">
                    <div className="max-w-[75%]">
                      <div className="bg-primary text-white rounded-2xl rounded-tr-sm px-3 py-2 text-xs leading-relaxed">
                        {m.respuesta_admin}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 text-right mr-1">
                        Jesús Gil · {m.updated_date ? format(new Date(m.updated_date), "dd/MM HH:mm") : ""}
                      </p>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Reply input */}
          <div className="px-4 py-3 border-t border-border bg-card flex gap-2">
            {lastUnanswered ? (
              <>
                <input
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="Escribe tu respuesta..."
                  className="flex-1 text-xs bg-muted border border-border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  onClick={handleSend}
                  disabled={!reply.trim()}
                  className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center disabled:opacity-40 hover:bg-primary/90 transition-colors flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex-1 flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                Todos los mensajes han sido respondidos.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          Selecciona una conversación para responder
        </div>
      )}
    </div>
  );
}