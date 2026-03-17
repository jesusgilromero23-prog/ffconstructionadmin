import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import PageHeader from "@/components/shared/PageHeader";
import DateRangeFilter from "@/components/shared/DateRangeFilter";
import EmptyState from "@/components/shared/EmptyState";
import TarjetaFormDialog from "@/components/tarjetas/TarjetaFormDialog";
import { motion, AnimatePresence } from "framer-motion";

const catColors = {
  gasolina: "bg-amber-100 text-amber-700",
  oficina: "bg-blue-100 text-blue-700",
  materiales: "bg-emerald-100 text-emerald-700",
  viajes: "bg-indigo-100 text-indigo-700",
  comidas: "bg-orange-100 text-orange-700",
  servicios: "bg-purple-100 text-purple-700",
  otros: "bg-gray-100 text-gray-700",
};

export default function Tarjetas() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const qc = useQueryClient();

  const { data: gastos = [] } = useQuery({
    queryKey: ["gastosTarjeta"], queryFn: () => base44.entities.GastoTarjeta.list("-fecha", 500),
  });

  const createMut = useMutation({
    mutationFn: (d) => base44.entities.GastoTarjeta.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["gastosTarjeta"] }); setShowForm(false); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.GastoTarjeta.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["gastosTarjeta"] }); setShowForm(false); setEditing(null); },
  });
  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.GastoTarjeta.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gastosTarjeta"] }),
  });

  const filtered = gastos.filter(g => {
    if (mes > 0 && g.mes !== mes) return false;
    if (g.anio !== anio) return false;
    return true;
  });

  // Group by card
  const byCard = {};
  filtered.forEach(g => {
    if (!byCard[g.tarjeta]) byCard[g.tarjeta] = [];
    byCard[g.tarjeta].push(g);
  });

  const total = filtered.reduce((s, g) => s + (g.monto || 0), 0);

  const handleSave = (data) => {
    if (editing) updateMut.mutate({ id: editing.id, data });
    else createMut.mutate(data);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Tarjetas de Crédito" subtitle="Control de gastos por tarjeta de crédito">
        <MonthYearFilter mes={mes} anio={anio} onMesChange={setMes} onAnioChange={setAnio} />
        <Button onClick={() => { setEditing(null); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Nuevo Gasto
        </Button>
      </PageHeader>

      <div className="bg-card rounded-2xl border border-border p-5 mb-6 flex items-center justify-between">
        <div className="flex gap-8">
          <div>
            <span className="text-xs text-muted-foreground block">Tarjetas activas</span>
            <span className="text-lg font-bold">{Object.keys(byCard).length}</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">Total transacciones</span>
            <span className="text-lg font-bold">{filtered.length}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-muted-foreground block">Monto total</span>
          <span className="text-2xl font-bold">${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {filtered.length === 0 ? <EmptyState message="No hay gastos de tarjeta en este período" /> : (
        Object.entries(byCard).map(([tarjeta, items]) => {
          const cardTotal = items.reduce((s, g) => s + (g.monto || 0), 0);
          return (
            <motion.div key={tarjeta} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm mb-4">
              <div className="px-5 py-3.5 bg-muted/30 flex items-center justify-between border-b border-border">
                <h3 className="font-semibold text-sm">Tarjeta: {tarjeta}</h3>
                <span className="font-bold text-sm">${cardTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-5 py-2.5 font-medium text-muted-foreground text-xs">Fecha</th>
                      <th className="text-left px-5 py-2.5 font-medium text-muted-foreground text-xs">Descripción</th>
                      <th className="text-left px-5 py-2.5 font-medium text-muted-foreground text-xs">Categoría</th>
                      <th className="text-left px-5 py-2.5 font-medium text-muted-foreground text-xs">Comercio</th>
                      <th className="text-right px-5 py-2.5 font-medium text-muted-foreground text-xs">Monto</th>
                      <th className="text-right px-5 py-2.5 font-medium text-muted-foreground text-xs">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(g => (
                      <tr key={g.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3 text-muted-foreground">{format(new Date(g.fecha), "dd/MM/yyyy")}</td>
                        <td className="px-5 py-3">{g.descripcion}</td>
                        <td className="px-5 py-3"><Badge className={catColors[g.categoria]}>{g.categoria}</Badge></td>
                        <td className="px-5 py-3 text-muted-foreground">{g.comercio || "—"}</td>
                        <td className="px-5 py-3 text-right font-semibold">${(g.monto || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(g); setShowForm(true); }}>
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMut.mutate(g.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          );
        })
      )}

      {showForm && (
        <TarjetaFormDialog
          open={showForm}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSave={handleSave}
          gasto={editing}
          isLoading={createMut.isPending || updateMut.isPending}
        />
      )}
    </div>
  );
}