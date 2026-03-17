import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Download } from "lucide-react";
import { generateProyectoPDF } from "@/lib/pdfGenerator";
import { format } from "date-fns";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import ProyectoDialog from "@/components/proyectos/ProyectoDialog";
import ContratoDialog from "@/components/proyectos/ContratoDialog";
import { motion, AnimatePresence } from "framer-motion";

const estadoColors = {
  en_ejecucion: "bg-blue-100 text-blue-700",
  completado: "bg-emerald-100 text-emerald-700",
  pausado: "bg-amber-100 text-amber-700",
  cancelado: "bg-red-100 text-red-700",
};

const contratoColors = {
  drywall: "bg-sky-100 text-sky-700",
  pintura: "bg-yellow-100 text-yellow-700",
  piso: "bg-stone-100 text-stone-700",
  plomeria: "bg-cyan-100 text-cyan-700",
  electricidad: "bg-amber-100 text-amber-700",
  estructura: "bg-slate-100 text-slate-700",
  acabados: "bg-pink-100 text-pink-700",
  techo: "bg-indigo-100 text-indigo-700",
  general: "bg-purple-100 text-purple-700",
  otros: "bg-gray-100 text-gray-700",
};

const tipoGastoLabels = {
  labor: "Labor",
  material: "Material",
  operativo: "Operativo",
  labor_extra: "Labor Extra",
};

const tipoGastoColors = {
  labor: "bg-blue-100 text-blue-700",
  material: "bg-emerald-100 text-emerald-700",
  operativo: "bg-purple-100 text-purple-700",
  labor_extra: "bg-orange-100 text-orange-700",
};

function ProjectCard({ proyecto, contratos, gastos, onEditProy, onDeleteProy, onEditContrato, onDeleteContrato, onNewContrato }) {
  const [expanded, setExpanded] = useState(true);
  const fmt = (v) => `$${(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  const totalContrato = contratos.reduce((s, c) => s + (c.monto_contrato || 0), 0);
  const laborGastos = gastos.filter(g => g.tipo_gasto === "labor" || g.tipo_gasto === "labor_extra");
  const materialGastos = gastos.filter(g => g.tipo_gasto === "material");
  const operativoGastos = gastos.filter(g => g.tipo_gasto === "operativo");

  const totalLabor = laborGastos.reduce((s, g) => s + (g.monto || 0), 0);
  const totalMaterial = materialGastos.reduce((s, g) => s + (g.monto || 0), 0);
  const totalOperativo = operativoGastos.reduce((s, g) => s + (g.monto || 0), 0);
  const totalGastos = totalLabor + totalMaterial + totalOperativo;
  const ganancia = totalContrato - totalGastos;
  const margen = totalContrato > 0 ? ((ganancia / totalContrato) * 100).toFixed(1) : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden mb-6">

      {/* Project Header */}
      <div className="px-6 py-4 flex items-start justify-between gap-4 border-b border-border">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <button onClick={() => setExpanded(!expanded)} className="mt-1 text-muted-foreground hover:text-foreground transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-foreground">{proyecto.nombre}</h2>
              <Badge className={estadoColors[proyecto.estado]}>{proyecto.estado?.replace("_", " ")}</Badge>
            </div>
            {proyecto.cliente && <p className="text-sm text-muted-foreground mt-0.5">Cliente: {proyecto.cliente}</p>}
            {proyecto.fecha_inicio && <p className="text-xs text-muted-foreground mt-0.5">Inicio: {format(new Date(proyecto.fecha_inicio), "dd/MM/yyyy")}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEditProy(proyecto)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDeleteProy(proyecto.id)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* P&L Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-0 border-b border-border text-xs">
        <div className="px-5 py-3 border-r border-border">
          <p className="text-muted-foreground mb-0.5">Contratos (+)</p>
          <p className="font-bold text-emerald-600">{fmt(totalContrato)}</p>
        </div>
        <div className="px-5 py-3 border-r border-border">
          <p className="text-muted-foreground mb-0.5">Labor (−)</p>
          <p className="font-semibold text-foreground">{fmt(totalLabor)}</p>
        </div>
        <div className="px-5 py-3 border-r border-border">
          <p className="text-muted-foreground mb-0.5">Materiales (−)</p>
          <p className="font-semibold text-foreground">{fmt(totalMaterial)}</p>
        </div>
        <div className="px-5 py-3 border-r border-border">
          <p className="text-muted-foreground mb-0.5">Operativos (−)</p>
          <p className="font-semibold text-foreground">{fmt(totalOperativo)}</p>
        </div>
        <div className={`px-5 py-3 ${ganancia >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
          <p className="text-muted-foreground mb-0.5 flex items-center gap-1">
            Ganancia {ganancia >= 0 ? <TrendingUp className="w-3 h-3 text-emerald-600" /> : <TrendingDown className="w-3 h-3 text-red-500" />}
          </p>
          <p className={`font-bold ${ganancia >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{fmt(ganancia)}</p>
          <p className={`text-[10px] ${ganancia >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>Margen: {margen}%</p>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            {/* Contracts Section */}
            <div className="px-6 pt-4 pb-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">Contratos del Proyecto</h3>
                <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={() => onNewContrato(proyecto.nombre)}>
                  <Plus className="w-3.5 h-3.5" /> Agregar Contrato
                </Button>
              </div>
              {contratos.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">Sin contratos registrados.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border mb-4">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">Tipo</th>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">Descripción</th>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">General Contractor</th>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">Fecha</th>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">Estado</th>
                        <th className="text-right px-4 py-2 font-medium text-muted-foreground">Monto Contrato</th>
                        <th className="text-right px-4 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {contratos.map(c => (
                        <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                          <td className="px-4 py-2.5"><Badge className={contratoColors[c.tipo_contrato]}>{c.tipo_contrato}</Badge></td>
                          <td className="px-4 py-2.5 text-muted-foreground">{c.descripcion || "—"}</td>
                          <td className="px-4 py-2.5">{c.general_contractor || "—"}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{c.fecha_contrato ? format(new Date(c.fecha_contrato), "dd/MM/yy") : "—"}</td>
                          <td className="px-4 py-2.5"><Badge variant="outline">{c.estado}</Badge></td>
                          <td className="px-4 py-2.5 text-right font-bold text-emerald-600">{fmt(c.monto_contrato)}</td>
                          <td className="px-4 py-2.5 text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEditContrato(c)}>
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => onDeleteContrato(c.id)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Expenses Section */}
            <div className="px-6 pb-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Gastos del Proyecto</h3>
              {gastos.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">Sin gastos registrados. Ve a "Gastos x Proyecto" para agregar.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">Fecha</th>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">Tipo</th>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">Descripción</th>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">Proveedor</th>
                        <th className="text-right px-4 py-2 font-medium text-muted-foreground">Monto (−)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gastos.map(g => (
                        <tr key={g.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                          <td className="px-4 py-2 text-muted-foreground">{format(new Date(g.fecha), "dd/MM/yy")}</td>
                          <td className="px-4 py-2"><Badge className={tipoGastoColors[g.tipo_gasto]}>{tipoGastoLabels[g.tipo_gasto]}</Badge></td>
                          <td className="px-4 py-2">{g.descripcion || "—"}</td>
                          <td className="px-4 py-2 text-muted-foreground">{g.proveedor || "—"}</td>
                          <td className="px-4 py-2 text-right font-semibold text-red-600">{fmt(g.monto)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Proyectos() {
  const [showProyForm, setShowProyForm] = useState(false);
  const [editingProy, setEditingProy] = useState(null);
  const [showContratoForm, setShowContratoForm] = useState(false);
  const [editingContrato, setEditingContrato] = useState(null);
  const [defaultProyecto, setDefaultProyecto] = useState("");
  const qc = useQueryClient();

  const { data: proyectos = [] } = useQuery({ queryKey: ["proyectos"], queryFn: () => base44.entities.Proyecto.list("-created_date", 200) });
  const { data: contratos = [] } = useQuery({ queryKey: ["contratos"], queryFn: () => base44.entities.ContratoProyecto.list("-fecha_contrato", 500) });
  const { data: gastos = [] } = useQuery({ queryKey: ["gastosProyecto"], queryFn: () => base44.entities.GastoProyecto.list("-fecha", 500) });

  const proyMut = {
    create: useMutation({ mutationFn: d => base44.entities.Proyecto.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["proyectos"] }); setShowProyForm(false); } }),
    update: useMutation({ mutationFn: ({ id, data }) => base44.entities.Proyecto.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["proyectos"] }); setShowProyForm(false); setEditingProy(null); } }),
    delete: useMutation({ mutationFn: id => base44.entities.Proyecto.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["proyectos"] }) }),
  };

  const contMut = {
    create: useMutation({ mutationFn: d => base44.entities.ContratoProyecto.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["contratos"] }); setShowContratoForm(false); } }),
    update: useMutation({ mutationFn: ({ id, data }) => base44.entities.ContratoProyecto.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["contratos"] }); setShowContratoForm(false); setEditingContrato(null); } }),
    delete: useMutation({ mutationFn: id => base44.entities.ContratoProyecto.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["contratos"] }) }),
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Proyectos" subtitle="Gestión de proyectos: contratos, gastos y ganancias">
        <Button onClick={() => { setEditingProy(null); setShowProyForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Nuevo Proyecto
        </Button>
      </PageHeader>

      {proyectos.length === 0 ? (
        <EmptyState message="No hay proyectos registrados" />
      ) : (
        proyectos.map(proy => (
          <ProjectCard
            key={proy.id}
            proyecto={proy}
            contratos={contratos.filter(c => c.proyecto_nombre === proy.nombre)}
            gastos={gastos.filter(g => g.proyecto === proy.nombre)}
            onEditProy={(p) => { setEditingProy(p); setShowProyForm(true); }}
            onDeleteProy={(id) => proyMut.delete.mutate(id)}
            onEditContrato={(c) => { setEditingContrato(c); setShowContratoForm(true); }}
            onDeleteContrato={(id) => contMut.delete.mutate(id)}
            onNewContrato={(nombre) => { setDefaultProyecto(nombre); setEditingContrato(null); setShowContratoForm(true); }}
          />
        ))
      )}

      {showProyForm && (
        <ProyectoDialog
          open={showProyForm}
          onClose={() => { setShowProyForm(false); setEditingProy(null); }}
          onSave={(data) => {
            if (editingProy) proyMut.update.mutate({ id: editingProy.id, data });
            else proyMut.create.mutate(data);
          }}
          proyecto={editingProy}
        />
      )}

      {showContratoForm && (
        <ContratoDialog
          open={showContratoForm}
          onClose={() => { setShowContratoForm(false); setEditingContrato(null); }}
          onSave={(data) => {
            if (editingContrato) contMut.update.mutate({ id: editingContrato.id, data });
            else contMut.create.mutate(data);
          }}
          contrato={editingContrato}
          defaultProyecto={defaultProyecto}
          proyectos={proyectos}
        />
      )}
    </div>
  );
}