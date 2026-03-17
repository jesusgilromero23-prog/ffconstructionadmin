import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useEditPermission } from "@/hooks/useEditPermission";
import AccessGuard from "@/components/shared/AccessGuard";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import DateRangeFilter from "@/components/shared/DateRangeFilter";
import EmptyState from "@/components/shared/EmptyState";
import { motion, AnimatePresence } from "framer-motion";

const tipoColors = {
  pago_cliente: "bg-emerald-100 text-emerald-700",
  deposito_bancario: "bg-blue-100 text-blue-700",
  prestamo: "bg-amber-100 text-amber-700",
  inversion: "bg-purple-100 text-purple-700",
  otro: "bg-gray-100 text-gray-700",
};

function DepositoForm({ open, onClose, onSave, deposito, proyectos }) {
  const [form, setForm] = useState(deposito || {
    descripcion: "", monto: "", tipo: "pago_cliente",
    fecha: new Date().toISOString().slice(0, 10), fuente: "", banco: "", notas: "",
    proyecto_nombre: "", prestamo_entidad: "", prestamo_tasa: "", prestamo_plazo: ""
  });
  const handleSubmit = (e) => {
    e.preventDefault();
    const fecha = new Date(form.fecha);
    const data = { ...form, monto: Number(form.monto), mes: fecha.getMonth() + 1, anio: fecha.getFullYear() };
    if (form.tipo !== "prestamo") {
      delete data.prestamo_entidad; delete data.prestamo_tasa; delete data.prestamo_plazo;
    } else {
      data.prestamo_tasa = Number(form.prestamo_tasa) || 0;
      data.prestamo_plazo = Number(form.prestamo_plazo) || 0;
    }
    onSave(data);
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{deposito ? "Editar Depósito" : "Nuevo Depósito"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Descripción *</Label>
            <Input value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={v => setForm({...form, tipo: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pago_cliente">Pago Cliente</SelectItem>
                  <SelectItem value="deposito_bancario">Depósito Bancario</SelectItem>
                  <SelectItem value="prestamo">💰 Préstamo Recibido</SelectItem>
                  <SelectItem value="inversion">Inversión</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Monto *</Label>
              <Input type="number" step="0.01" value={form.monto} onChange={e => setForm({...form, monto: e.target.value})} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha *</Label>
              <Input type="date" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Fuente / Cliente</Label>
              <Input value={form.fuente} onChange={e => setForm({...form, fuente: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Banco</Label>
              <Input value={form.banco} onChange={e => setForm({...form, banco: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Proyecto (opcional)</Label>
              <Select value={form.proyecto_nombre || ""} onValueChange={v => setForm({...form, proyecto_nombre: v === "__none__" ? "" : v})}>
                <SelectTrigger><SelectValue placeholder="Sin proyecto" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Sin proyecto —</SelectItem>
                  {(proyectos || []).map(p => <SelectItem key={p.id} value={p.nombre}>{p.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Campos adicionales solo si es préstamo */}
          {form.tipo === "prestamo" && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-3">
              <p className="text-xs font-semibold text-amber-700">Detalles del Préstamo</p>
              <div className="space-y-2">
                <Label>Entidad Prestamista</Label>
                <Input placeholder="Banco, persona, institución..." value={form.prestamo_entidad} onChange={e => setForm({...form, prestamo_entidad: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Tasa de Interés %</Label>
                  <Input type="number" step="0.01" placeholder="0.00" value={form.prestamo_tasa} onChange={e => setForm({...form, prestamo_tasa: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Plazo (meses)</Label>
                  <Input type="number" placeholder="0" value={form.prestamo_plazo} onChange={e => setForm({...form, prestamo_plazo: e.target.value})} />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea value={form.notas} onChange={e => setForm({...form, notas: e.target.value})} className="h-16" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">{deposito ? "Actualizar" : "Guardar"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Depositos() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const todayStr = today.toISOString().slice(0, 10);
  const [desde, setDesde] = useState(firstOfMonth);
  const [hasta, setHasta] = useState(todayStr);
  const qc = useQueryClient();
  const fmt = (v) => `$${(v||0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  const { canEdit, user } = useEditPermission();

  const { data: depositos = [] } = useQuery({ queryKey: ["depositos"], queryFn: () => base44.entities.Deposito.list("-fecha", 500) });
  const { data: proyectos = [] } = useQuery({ queryKey: ["proyectos"], queryFn: () => base44.entities.Proyecto.list("-created_date", 200) });

  const createMut = useMutation({ mutationFn: d => base44.entities.Deposito.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["depositos"] }); setShowForm(false); } });
  const updateMut = useMutation({ mutationFn: ({ id, data }) => base44.entities.Deposito.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["depositos"] }); setShowForm(false); setEditing(null); } });
  const deleteMut = useMutation({ mutationFn: id => base44.entities.Deposito.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["depositos"] }) });

  const filtered = depositos.filter(d => {
    if (!d.fecha) return false;
    if (desde && d.fecha < desde) return false;
    if (hasta && d.fecha > hasta) return false;
    return true;
  });

  const total = filtered.reduce((s, d) => s + (d.monto || 0), 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Depósitos / Ingresos" subtitle="Registro de dinero entrante a la empresa">
        <DateRangeFilter desde={desde} hasta={hasta} onDesdeChange={setDesde} onHastaChange={setHasta} />
        {canEdit && (
          <Button onClick={() => { setEditing(null); setShowForm(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> Nuevo Depósito
          </Button>
        )}
      </PageHeader>

      {!canEdit && user && <AccessGuard user={user} />}

      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-6 flex items-center justify-between">
        <span className="text-sm font-medium text-emerald-700">Total ingresos del período</span>
        <span className="text-2xl font-bold text-emerald-700">{fmt(total)}</span>
      </div>

      {filtered.length === 0 ? <EmptyState message="No hay depósitos registrados en este período" /> : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Fecha</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Descripción</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Tipo</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Fuente</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Banco</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Proyecto</th>
                  <th className="text-right px-5 py-3 font-medium text-muted-foreground">Monto</th>
                  <th className="text-right px-5 py-3 font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map(d => (
                    <motion.tr key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3.5 text-muted-foreground">{format(new Date(d.fecha), "dd/MM/yyyy")}</td>
                      <td className="px-5 py-3.5 font-medium">{d.descripcion}</td>
                      <td className="px-5 py-3.5"><Badge className={tipoColors[d.tipo]}>{d.tipo?.replace("_", " ")}</Badge></td>
                      <td className="px-5 py-3.5 text-muted-foreground">{d.fuente || "—"}</td>
                      <td className="px-5 py-3.5 text-muted-foreground">{d.banco || "—"}</td>
                      <td className="px-5 py-3.5">{d.proyecto_nombre ? <Badge className="bg-indigo-100 text-indigo-700 text-xs">{d.proyecto_nombre}</Badge> : <span className="text-muted-foreground">—</span>}</td>
                      <td className="px-5 py-3.5 text-right font-bold text-emerald-600">{fmt(d.monto)}</td>
                      <td className="px-5 py-3.5 text-right">
                      {canEdit && (
                       <div className="flex justify-end gap-1">
                         <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(d); setShowForm(true); }}>
                           <Pencil className="w-3.5 h-3.5" />
                         </Button>
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMut.mutate(d.id)}>
                           <Trash2 className="w-3.5 h-3.5" />
                         </Button>
                       </div>
                      )}
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
        <DepositoForm
          open={showForm}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSave={(data) => {
            if (editing) updateMut.mutate({ id: editing.id, data });
            else createMut.mutate(data);
          }}
          deposito={editing}
          proyectos={proyectos}
        />
      )}
    </div>
  );
}