import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, CheckCircle2, Clock, XCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function AccessRequestBanner({ user }) {
  const [motivo, setMotivo] = useState("");
  const [showForm, setShowForm] = useState(false);
  const qc = useQueryClient();

  const { data: solicitudes = [] } = useQuery({
    queryKey: ["solicitudesAcceso", user?.email],
    queryFn: () => base44.entities.SolicitudAcceso.filter({ usuario_email: user?.email }, "-created_date", 5),
    enabled: !!user?.email,
  });

  const ultima = solicitudes[0];

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.SolicitudAcceso.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["solicitudesAcceso"] });
      setShowForm(false);
      setMotivo("");
    },
  });

  const handleSubmit = () => {
    if (!motivo.trim()) return;
    createMut.mutate({
      usuario_email: user?.email,
      usuario_nombre: user?.full_name || user?.email,
      motivo: motivo.trim(),
      estado: "pendiente",
    });
  };

  if (ultima?.estado === "aprobado") return null; // Has access, no banner needed

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border mb-6 overflow-hidden">
      {!ultima || ultima.estado === "rechazado" ? (
        <div className="bg-amber-50 border-amber-200 border rounded-2xl px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Panel en modo solo lectura</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Solo el administrador puede modificar datos. Solicita acceso de edición si lo necesitas.
                </p>
                {ultima?.estado === "rechazado" && (
                  <p className="text-xs text-red-600 mt-1">Tu solicitud anterior fue rechazada. Puedes enviar una nueva.</p>
                )}
              </div>
            </div>
            {!showForm && (
              <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100 text-xs flex-shrink-0"
                onClick={() => setShowForm(true)}>
                Solicitar acceso
              </Button>
            )}
          </div>
          {showForm && (
            <div className="mt-3 flex gap-2">
              <input
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                placeholder="Describe por qué necesitas acceso de edición..."
                className="flex-1 text-xs bg-white border border-amber-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-amber-300"
              />
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 text-xs"
                onClick={handleSubmit} disabled={createMut.isPending}>
                <Send className="w-3 h-3" /> Enviar
              </Button>
              <Button size="sm" variant="ghost" className="text-xs" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          )}
        </div>
      ) : ultima?.estado === "pendiente" ? (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-800">Solicitud de acceso en revisión</p>
            <p className="text-xs text-blue-600 mt-0.5">El administrador revisará tu solicitud pronto.</p>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}