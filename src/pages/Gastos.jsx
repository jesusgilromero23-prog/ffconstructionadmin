import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import PageHeader from "@/components/shared/PageHeader";
import MonthYearFilter from "@/components/shared/MonthYearFilter";
import EmptyState from "@/components/shared/EmptyState";
import GastoFormDialog from "@/components/gastos/GastoFormDialog";
import { motion, AnimatePresence } from "framer-motion";

const catColors = {
  gasolina: "bg-amber-100 text-amber-700",
  oficina: "bg-blue-100 text-blue-700",
  materiales: "bg-emerald-100 text-emerald-700",
  servicios: "bg-purple-100 text-purple-700",
  otros: "bg-gray-100 text-gray-700",
};

export default function Gastos() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const qc = useQueryClient();

  const { data: gastos = [], isLoading } = useQuery({
    queryKey: ["gastos"], queryFn: () => base44.entities.Gasto.list("-fecha", 500),
  });

  const createMut = useMutation({
    mutationFn: (d) => base44.entities.Gasto.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["gastos"] }); setShowForm(false); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Gasto.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["gastos"] }); setShowForm(false); setEditing(null); },
  });
  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Gasto.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gastos"] }),
  });

  const filtered = gastos.filter(g => {
    if (mes > 0 && g.mes !== mes) return false;
    if (g.anio !== anio) return false;
    return true;
  });

  const total = filtered.reduce((s, g) => s + (g.monto || 0), 0);

  const handleSave = (data) => {
    if (editing) updateMut.mutate({ id: editing.id, data });
    else createMut.mutate(data);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Gastos Generales" subtitle="Control de gastos de gasolina, oficina, materiales y más">
        <MonthYearFilter mes={mes} anio={anio} onMesChange={setMes} onAnioChange={setAnio} />
        <Button onClick={() => { setEditing(null); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Nuevo Gasto
        </Button>
      </PageHeader>

      {/* Summary */}
      <div className="bg-card rounded-2xl border border-border p-5 mb-6 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Total del período</span>
        <span className="text-2xl font-bold text-foreground">${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? <EmptyState message="No hay gastos registrados en este período" /> : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Fecha</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Descripción</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Categoría</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Proveedor</th>
                  <th className="text-right px-5 py-3 font-medium text-muted-foreground">Monto</th>
                  <th className="text-right px-5 py-3 font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((g) => (
                    <motion.tr key={g.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3.5 text-muted-foreground">{format(new Date(g.fecha), "dd/MM/yyyy")}</td>
                      <td className="px-5 py-3.5 font-medium">{g.descripcion}</td>
                      <td className="px-5 py-3.5">
                        <Badge className={catColors[g.categoria]}>{g.categoria}</Badge>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">{g.proveedor || "—"}</td>
                      <td className="px-5 py-3.5 text-right font-semibold">${(g.monto || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(g); setShowForm(true); }}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMut.mutate(g.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <GastoFormDialog
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