import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Calendar, Percent, Clock, Plus, Trash2, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";

const fmt = (v) => `$${(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

function PagoForm({ open, onClose, onSave, prestamo }) {
  const [form, setForm] = useState({
    numero_cheque: "",
    monto: "",
    fecha: new Date().toISOString().slice(0, 10),
    notas: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const fecha = new Date(form.fecha);
    onSave({
      ...form,
      monto: Number(form.monto),
      mes: fecha.getMonth() + 1,
      anio: fecha.getFullYear(),
      prestamo_id: prestamo.id,
      prestamo_descripcion: prestamo.descripcion
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Registrar Pago</DialogTitle>
          <p className="text-xs text-muted-foreground">{prestamo?.descripcion}</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>N° de Cheque</Label>
            <Input
              placeholder="Ej. 1023"
              value={form.numero_cheque}
              onChange={e => setForm({ ...form, numero_cheque: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Monto *</Label>
              <Input
                type="number" step="0.01" placeholder="0.00"
                value={form.monto}
                onChange={e => setForm({ ...form, monto: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha *</Label>
              <Input
                type="date"
                value={form.fecha}
                onChange={e => setForm({ ...form, fecha: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} className="h-16" />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Guardar Pago</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PrestamoCard({ prestamo, pagos, onAddPago, onDeletePago }) {
  const [expanded, setExpanded] = useState(false);
  const totalPagado = pagos.reduce((s, p) => s + (p.monto || 0), 0);
  const saldo = (prestamo.monto || 0) - totalPagado;
  const pct = prestamo.monto > 0 ? Math.min((totalPagado / prestamo.monto) * 100, 100) : 0;
  const pagado = saldo <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card border rounded-2xl shadow-sm overflow-hidden ${pagado ? "border-emerald-200" : "border-border"}`}
    >
      {/* Header */}
      <div className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {pagado
                ? <Badge className="bg-emerald-100 text-emerald-700 text-xs gap-1"><CheckCircle2 className="w-3 h-3" /> Pagado</Badge>
                : <Badge className="bg-blue-100 text-blue-700 text-xs">Activo</Badge>
              }
              {prestamo.prestamo_entidad && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> {prestamo.prestamo_entidad}
                </span>
              )}
            </div>
            <p className="font-semibold text-base">{prestamo.descripcion}</p>
            <div className="flex flex-wrap gap-4 mt-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(prestamo.fecha), "dd/MM/yyyy")}</span>
              {prestamo.prestamo_tasa > 0 && <span className="flex items-center gap-1"><Percent className="w-3 h-3" />{prestamo.prestamo_tasa}% interés</span>}
              {prestamo.prestamo_plazo > 0 && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{prestamo.prestamo_plazo} meses</span>}
              {prestamo.banco && <span>Banco: {prestamo.banco}</span>}
            </div>
          </div>

          {/* Amounts */}
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-muted-foreground">Monto original</p>
            <p className="text-xl font-bold text-blue-700">{fmt(prestamo.monto)}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Pagado: <span className="font-semibold text-emerald-600">{fmt(totalPagado)}</span></span>
            <span className={`font-bold ${saldo > 0 ? "text-red-600" : "text-emerald-600"}`}>
              Saldo: {fmt(Math.max(saldo, 0))}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${pct >= 100 ? "bg-emerald-500" : "bg-primary"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5 text-right">{pct.toFixed(0)}% pagado</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-primary flex items-center gap-1 hover:underline"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {pagos.length} pago(s) registrado(s)
          </button>
          {!pagado && (
            <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={() => onAddPago(prestamo)}>
              <Plus className="w-3 h-3" /> Registrar Pago
            </Button>
          )}
        </div>
      </div>

      {/* Pagos list */}
      <AnimatePresence>
        {expanded && pagos.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="border-t border-border overflow-hidden"
          >
            <div className="bg-muted/30 p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Historial de Pagos</p>
              {pagos.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-card rounded-xl px-4 py-2.5 border border-border text-sm">
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(p.fecha), "dd/MM/yyyy")}</span>
                    {p.numero_cheque && <span className="font-mono bg-muted px-1.5 py-0.5 rounded">Cheque #{p.numero_cheque}</span>}
                    {p.notas && <span className="italic">{p.notas}</span>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-bold text-emerald-600">{fmt(p.monto)}</span>
                    <button onClick={() => onDeletePago(p.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
        {expanded && pagos.length === 0 && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            className="border-t border-border overflow-hidden">
            <p className="text-xs text-muted-foreground text-center py-4">Sin pagos registrados aún</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function PrestamosDeposito() {
  const today = new Date();
  const firstOfYear = new Date(today.getFullYear(), 0, 1).toISOString().slice(0, 10);
  const todayStr = today.toISOString().slice(0, 10);
  const [desde, setDesde] = useState(firstOfYear);
  const [hasta, setHasta] = useState(todayStr);
  const [pagoTarget, setPagoTarget] = useState(null);
  const qc = useQueryClient();

  const { data: depositos = [] } = useQuery({ queryKey: ["depositos"], queryFn: () => base44.entities.Deposito.list("-fecha", 500) });
  const { data: pagosPrestamo = [] } = useQuery({ queryKey: ["pagosPrestamo"], queryFn: () => base44.entities.PagoPrestamo.list("-fecha", 500) });

  const createPago = useMutation({
    mutationFn: d => base44.entities.PagoPrestamo.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pagosPrestamo"] }); setPagoTarget(null); }
  });
  const deletePago = useMutation({
    mutationFn: id => base44.entities.PagoPrestamo.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pagosPrestamo"] })
  });

  const todos = depositos.filter(d => d.tipo === "prestamo");
  const filtrados = anio === 0 ? todos : todos.filter(p => p.anio === anio);

  const totalPrestado = filtrados.reduce((s, p) => s + (p.monto || 0), 0);
  const totalPagado = pagosPrestamo
    .filter(p => filtrados.some(f => f.id === p.prestamo_id))
    .reduce((s, p) => s + (p.monto || 0), 0);
  const saldoTotal = totalPrestado - totalPagado;

  const activos = filtrados.filter(p => {
    const pagadoP = pagosPrestamo.filter(x => x.prestamo_id === p.id).reduce((s, x) => s + (x.monto || 0), 0);
    return pagadoP < (p.monto || 0);
  });
  const pagados = filtrados.filter(p => {
    const pagadoP = pagosPrestamo.filter(x => x.prestamo_id === p.id).reduce((s, x) => s + (x.monto || 0), 0);
    return pagadoP >= (p.monto || 0);
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Control de Préstamos" subtitle="Seguimiento de préstamos recibidos y sus pagos">
        <select
          value={anio}
          onChange={e => setAnio(Number(e.target.value))}
          className="text-sm border border-input rounded-lg px-3 py-1.5 bg-card"
        >
          <option value={0}>Todos los años</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </PageHeader>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Total Recibido</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{fmt(totalPrestado)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{filtrados.length} préstamo(s)</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Total Pagado</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{fmt(totalPagado)}</p>
        </div>
        <div className={`border rounded-2xl p-4 ${saldoTotal > 0 ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"}`}>
          <p className={`text-xs font-semibold uppercase tracking-wide ${saldoTotal > 0 ? "text-red-600" : "text-emerald-600"}`}>Saldo Pendiente</p>
          <p className={`text-2xl font-bold mt-1 ${saldoTotal > 0 ? "text-red-700" : "text-emerald-700"}`}>{fmt(saldoTotal)}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Activos / Pagados</p>
          <p className="text-2xl font-bold text-purple-700 mt-1">{activos.length} / {pagados.length}</p>
        </div>
      </div>

      {filtrados.length === 0 ? (
        <EmptyState message="No hay préstamos registrados. Agrega depósitos con tipo 'Préstamo' en la sección de Depósitos." />
      ) : (
        <Tabs defaultValue="activos">
          <TabsList className="bg-card border border-border mb-4">
            <TabsTrigger value="activos">Activos ({activos.length})</TabsTrigger>
            <TabsTrigger value="pagados">Pagados ({pagados.length})</TabsTrigger>
            <TabsTrigger value="todos">Todos ({filtrados.length})</TabsTrigger>
          </TabsList>

          {[
            { value: "activos", list: activos },
            { value: "pagados", list: pagados },
            { value: "todos", list: filtrados },
          ].map(tab => (
            <TabsContent key={tab.value} value={tab.value}>
              {tab.list.length === 0 ? (
                <EmptyState message="No hay préstamos en esta categoría" />
              ) : (
                <div className="space-y-4">
                  {tab.list.map(p => (
                    <PrestamoCard
                      key={p.id}
                      prestamo={p}
                      pagos={pagosPrestamo.filter(x => x.prestamo_id === p.id)}
                      onAddPago={setPagoTarget}
                      onDeletePago={(id) => deletePago.mutate(id)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}

      {pagoTarget && (
        <PagoForm
          open={!!pagoTarget}
          onClose={() => setPagoTarget(null)}
          onSave={data => createPago.mutate(data)}
          prestamo={pagoTarget}
        />
      )}
    </div>
  );
}