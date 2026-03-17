import React, { useState } from "react";
import { Lock, Send, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Banner shown to users without edit access.
 * Shows the current request status or a form to request access.
 */
export default function AccessGuard({ user }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState(user?.full_name || "");
  const [motivo, setMotivo] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const { data: solicitudes = [] } = useQuery({
    queryKey: ["misSolicitudes", user?.email],
    queryFn: () => base44.entities.SolicitudAcceso.filter({ usuario_email: user.email }),
    enabled: !!user?.email,
    staleTime: 30000,
  });

  const ultima = solicitudes[0];

  const handleSend = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setSending(true);
    try {
      await base44.functions.invoke("solicitarAcceso", {
        usuario_email: user.email,
        usuario_nombre: nombre,
        motivo,
      });
      qc.invalidateQueries({ queryKey: ["misSolicitudes", user?.email] });
      setSent(true);
      setShowForm(false);
    } finally {
      setSending(false);
    }
  };

  if (ultima?.estado === "pendiente") {
    return (
      <div className="mb-5 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm">
        <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
        <span className="text-amber-800">Tu solicitud de acceso está <strong>pendiente de aprobación</strong>. El administrador te notificará pronto.</span>
      </div>
    );
  }

  if (ultima?.estado === "rechazado") {
    return (
      <div className="mb-5 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm">
        <Lock className="w-4 h-4 text-red-500 flex-shrink-0" />
        <span className="text-red-800">Tu solicitud fue <strong>rechazada</strong>. {ultima.respuesta_admin && `Motivo: ${ultima.respuesta_admin}`}</span>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="mb-5 flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm">
        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
        <span className="text-emerald-800">Solicitud enviada. El administrador revisará tu solicitud y te otorgará acceso por correo.</span>
      </div>
    );
  }

  return (
    <div className="mb-5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-blue-800">
          <Lock className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <span>Modo solo lectura. Necesitas <strong>acceso especial</strong> para agregar o editar registros.</span>
        </div>
        <Button size="sm" className="gap-1.5 flex-shrink-0" onClick={() => setShowForm(!showForm)}>
          <Send className="w-3.5 h-3.5" /> Solicitar acceso
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSend} className="mt-3 space-y-3 border-t border-blue-200 pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Tu nombre *</Label>
              <Input value={nombre} onChange={e => setNombre(e.target.value)} required placeholder="Nombre completo" className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Correo (automático)</Label>
              <Input value={user?.email || ""} disabled className="h-8 text-sm bg-muted" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">¿Por qué necesitas acceso de edición?</Label>
            <Textarea value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Describe brevemente tu rol o motivo..." className="h-16 text-sm" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button type="submit" size="sm" disabled={sending || !nombre.trim()}>
              {sending ? "Enviando..." : "Enviar solicitud"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}