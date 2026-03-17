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
import ChequeFormDialog from "@/components/cheques/ChequeFormDialog";
import { motion, AnimatePresence } from "framer-motion";

const estadoColors = {
  emitido: "bg-blue-100 text-blue-700",
  cobrado: "bg-emerald-100 text-emerald-700",
  cancelado: "bg-red-100 text-red-700",
  pendiente: "bg-amber-100 text-amber-700",
};

export default function Cheques() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const qc = useQueryClient();

  const { data: cheques = [] } = useQuery({
    queryKey: ["cheques"], queryFn: () => base44.entities.Cheque.list("-numero_cheque", 500),
  });

  const createMut = useMutation({
    mutationFn: (d) => base44.entities.Cheque.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cheques"] }); setShowForm(false); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Cheque.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cheques"] }); setShowForm(false); setEditing(null); },
  });
  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Cheque.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cheques"] }),
  });

  const filtered = cheques.filter(c => {
    if (mes > 0 && c.mes !== mes) return false;
    if (c.anio !== anio) return false;
    return true;
  });

  const total = filtered.reduce((s, c) => s + (c.monto || 0), 0);
  const nextNumber = cheques.length > 0 ? Math.max(...cheques.map(c => c.numero_cheque || 0)) + 1 : 1;

  const handleSave = (data) => {
    if (editing) updateMut.mutate({ id: editing.id, data });
    else createMut.mutate(data);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Control de Cheques" subtitle="Consecutivo numérico, montos y seguimiento de cheques">
        <MonthYearFilter mes={mes} anio={anio} onMesChange={setMes} onAnioChange={setAnio} />
        <Button onClick={() => { setEditing(null); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Nuevo Cheque
        </Button>
      </PageHeader>

      <div className="bg-card rounded-2xl border border-border p-5 mb-6 flex items-center justify-between">
        <div className="flex gap-8">
          <div>
            <span className="text-xs text-muted-foreground block">Próximo consecutivo</span>
            <span className="text-lg font-bold">#{nextNumber}</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">Total cheques período</span>
            <span className="text-lg font-bold">{filtered.length}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-muted-foreground block">Monto total</span>
          <span className="text-2xl font-bold">${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {filtered.length === 0 ? <EmptyState message="No hay cheques registrados en este período" /> : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">No.</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Fecha</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Beneficiario</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Concepto</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Banco</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Estado</th>
                  <th className="text-right px-5 py-3 font-medium text-muted-foreground">Monto</th>
                  <th className="text-right px-5 py-3 font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((c) => (
                    <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3.5 font-semibold">#{c.numero_cheque}</td>
                      <td className="px-5 py-3.5 text-muted-foreground">{format(new Date(c.fecha_emision), "dd/MM/yyyy")}</td>
                      <td className="px-5 py-3.5 font-medium">{c.beneficiario}</td>
                      <td className="px-5 py-3.5 text-muted-foreground">{c.concepto || "—"}</td>
                      <td className="px-5 py-3.5 text-muted-foreground">{c.banco || "—"}</td>
                      <td className="px-5 py-3.5">
                        <Badge className={estadoColors[c.estado]}>{c.estado}</Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold">${(c.monto || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(c); setShowForm(true); }}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMut.mutate(c.id)}>
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
        <ChequeFormDialog
          open={showForm}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSave={handleSave}
          cheque={editing}
          isLoading={createMut.isPending || updateMut.isPending}
          nextNumber={nextNumber}
        />
      )}
    </div>
  );
}