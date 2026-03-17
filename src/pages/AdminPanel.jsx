import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle, MessageSquare, Users, Clock, Send, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import PageHeader from "@/components/shared/PageHeader";
import { format } from "date-fns";
import ChatConversationPanel from "@/components/admin/ChatConversationPanel";

function SolicitudCard({ s, onApprove, onReject }) {
  const estadoColors = {
    pendiente: "bg-amber-100 text-amber-700",
    aprobado: "bg-emerald-100 text-emerald-700",
    rechazado: "bg-red-100 text-red-700",
  };
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold">{s.usuario_nombre}</p>
            <Badge className={estadoColors[s.estado]}>{s.estado}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{s.usuario_email}</p>
          {s.motivo && <p className="text-xs mt-2 text-foreground bg-muted/50 rounded-lg px-3 py-2">"{s.motivo}"</p>}
          <p className="text-[10px] text-muted-foreground mt-2">
            {s.created_date ? format(new Date(s.created_date), "dd/MM/yyyy HH:mm") : "—"}
          </p>
        </div>
        {s.estado === "pendiente" && (
          <div className="flex gap-2 flex-shrink-0">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-xs h-8"
              onClick={() => onApprove(s.id)}>
              <CheckCircle2 className="w-3.5 h-3.5" /> Aprobar
            </Button>
            <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 gap-1 text-xs h-8"
              onClick={() => onReject(s.id)}>
              <XCircle className="w-3.5 h-3.5" /> Rechazar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function MensajeCard({ m, onRespond }) {
  const [respuesta, setRespuesta] = useState("");
  const [showInput, setShowInput] = useState(false);

  return (
    <div className={`bg-card border rounded-xl p-4 ${!m.leido_admin ? "border-primary/40 bg-primary/5" : "border-border"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold">{m.usuario_nombre}</p>
            {!m.leido_admin && <Badge className="bg-primary/10 text-primary text-[10px]">Nuevo</Badge>}
            {m.respondido && <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Respondido</Badge>}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{m.usuario_email}</p>
          <p className="text-sm mt-2 text-foreground">{m.mensaje}</p>
          {m.respuesta_admin && (
            <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              <p className="text-[10px] font-semibold text-emerald-700 mb-1">Tu respuesta:</p>
              <p className="text-xs text-emerald-800">{m.respuesta_admin}</p>
            </div>
          )}
          <p className="text-[10px] text-muted-foreground mt-2">
            {m.created_date ? format(new Date(m.created_date), "dd/MM/yyyy HH:mm") : "—"}
          </p>
        </div>
        {!m.respondido && (
          <Button size="sm" variant="outline" className="flex-shrink-0 text-xs h-8 gap-1"
            onClick={() => setShowInput(true)}>
            <MessageSquare className="w-3.5 h-3.5" /> Responder
          </Button>
        )}
      </div>
      {showInput && (
        <div className="mt-3 flex gap-2">
          <input
            value={respuesta}
            onChange={e => setRespuesta(e.target.value)}
            placeholder="Escribe tu respuesta..."
            className="flex-1 text-xs bg-muted border border-border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
          />
          <Button size="sm" className="gap-1 text-xs"
            onClick={() => { onRespond(m.id, respuesta); setShowInput(false); setRespuesta(""); }}
            disabled={!respuesta.trim()}>
            <Send className="w-3 h-3" /> Enviar
          </Button>
          <Button size="sm" variant="ghost" className="text-xs" onClick={() => setShowInput(false)}>Cancelar</Button>
        </div>
      )}
    </div>
  );
}

export default function AdminPanel() {
  const [tab, setTab] = useState("mensajes");
  const qc = useQueryClient();
  const markedReadRef = useRef(new Set());

  // Security: verify admin role client-side (server enforces via Base44 entity rules)
  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me(), staleTime: 60000 });
  if (user && user.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground">Acceso restringido</p>
          <p className="text-xs text-muted-foreground mt-1">Solo administradores pueden ver este panel.</p>
        </div>
      </div>
    );
  }

  const { data: solicitudes = [] } = useQuery({
    queryKey: ["solicitudesAdmin"],
    queryFn: () => base44.entities.SolicitudAcceso.list("-created_date", 100),
    refetchInterval: 30000,
  });

  const { data: mensajes = [] } = useQuery({
    queryKey: ["mensajesAdmin"],
    queryFn: () => base44.entities.MensajeChat.list("-created_date", 100),
    refetchInterval: 15000,
  });

  const updateSolicitud = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SolicitudAcceso.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["solicitudesAdmin"] }),
  });

  const updateMensaje = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MensajeChat.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mensajesAdmin"] }),
  });

  const pendienteSolicitudes = solicitudes.filter(s => s.estado === "pendiente").length;
  const nuevosMensajes = mensajes.filter(m => !m.leido_admin).length;

  const handleApprove = (id) => updateSolicitud.mutate({ id, data: { estado: "aprobado", fecha_respuesta: new Date().toISOString().split("T")[0] } });
  const handleReject = (id) => updateSolicitud.mutate({ id, data: { estado: "rechazado", fecha_respuesta: new Date().toISOString().split("T")[0] } });
  const handleRespond = (id, respuesta) => {
    updateMensaje.mutate({ id, data: { respuesta_admin: respuesta, respondido: true, leido_admin: true } });
  };

  // Mark messages as read when viewing (only once per message ID)
  useEffect(() => {
    if (tab !== "mensajes") return;
    mensajes
      .filter(m => !m.leido_admin && !markedReadRef.current.has(m.id))
      .forEach(m => {
        markedReadRef.current.add(m.id);
        updateMensaje.mutate({ id: m.id, data: { leido_admin: true } });
      });
  }, [tab, mensajes]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <PageHeader title="Panel de Administrador" subtitle="Gestión de solicitudes de acceso y mensajes del chat">
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5">
          <Shield className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-semibold text-emerald-700">Administrador: Jesús Gil</span>
        </div>
      </PageHeader>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-muted/50 rounded-xl p-1">
        <button
          onClick={() => setTab("mensajes")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${tab === "mensajes" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          <MessageSquare className="w-4 h-4" />
          Mensajes del Chat
          {nuevosMensajes > 0 && (
            <span className="bg-primary text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{nuevosMensajes}</span>
          )}
        </button>
        <button
          onClick={() => setTab("solicitudes")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${tab === "solicitudes" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Users className="w-4 h-4" />
          Solicitudes de Acceso
          {pendienteSolicitudes > 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{pendienteSolicitudes}</span>
          )}
        </button>
      </div>

      {tab === "mensajes" && (
        <div className="space-y-3">
          {mensajes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No hay mensajes aún.</div>
          ) : (
            mensajes.map(m => (
              <MensajeCard key={m.id} m={m} onRespond={handleRespond} />
            ))
          )}
        </div>
      )}

      {tab === "solicitudes" && (
        <div className="space-y-3">
          {solicitudes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No hay solicitudes de acceso.</div>
          ) : (
            solicitudes.map(s => (
              <SolicitudCard key={s.id} s={s} onApprove={handleApprove} onReject={handleReject} />
            ))
          )}
        </div>
      )}
    </div>
  );
}