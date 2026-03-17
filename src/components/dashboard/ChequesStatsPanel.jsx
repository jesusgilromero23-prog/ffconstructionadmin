import React, { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";

const MESES_CORTOS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const COLORS = ["hsl(226,70%,55%)","hsl(168,60%,45%)","hsl(262,60%,55%)","hsl(38,92%,50%)","hsl(0,84%,60%)","hsl(200,70%,50%)","hsl(300,50%,50%)","hsl(30,80%,55%)","hsl(180,60%,40%)","hsl(340,70%,50%)"];
const fmt = (v) => `$${(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

export default function ChequesStatsPanel({ cheques = [] }) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 4 }, (_, i) => currentYear - i);
  const [anio, setAnio] = useState(currentYear);

  const filtered = useMemo(() => cheques.filter(c => c.anio === anio), [cheques, anio]);

  // Monthly cash flow
  const flujoMensual = useMemo(() =>
    MESES_CORTOS.map((m, i) => ({
      mes: m,
      total: filtered.filter(c => c.mes === i + 1).reduce((s, c) => s + (c.monto || 0), 0),
      cantidad: filtered.filter(c => c.mes === i + 1).length,
    })),
  [filtered]);

  // Distribution by beneficiary (top 10)
  const porBeneficiario = useMemo(() => {
    const map = {};
    filtered.forEach(c => {
      const key = c.beneficiario || "Sin nombre";
      map[key] = (map[key] || 0) + (c.monto || 0);
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filtered]);

  const totalAnio = filtered.reduce((s, c) => s + (c.monto || 0), 0);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
      className="bg-card rounded-2xl border border-border p-6 shadow-sm">

      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <h3 className="text-sm font-semibold">Panel de Cheques Emitidos</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filtered.length} cheques · Total {fmt(totalAnio)}
          </p>
        </div>
        <Select value={String(anio)} onValueChange={v => setAnio(Number(v))}>
          <SelectTrigger className="w-24 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-5">
        {/* Monthly cash flow */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Flujo Mensual — {anio}</p>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={flujoMensual} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} width={45} />
                <Tooltip
                  formatter={(v, name) => [fmt(v), "Monto"]}
                  labelFormatter={label => label}
                  contentStyle={{ fontSize: 11 }}
                />
                <Bar dataKey="total" name="Total" radius={[5,5,0,0]} fill="hsl(226,70%,55%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* By beneficiary */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Distribución por Beneficiario</p>
          {porBeneficiario.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">Sin datos</div>
          ) : (
            <div className="flex gap-4 h-56">
              <div className="flex-shrink-0" style={{ width: 140, height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={porBeneficiario} cx="50%" cy="50%" innerRadius={38} outerRadius={62} dataKey="value" paddingAngle={3}>
                      {porBeneficiario.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={v => fmt(v)} contentStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 overflow-y-auto space-y-1.5 py-1">
                {porBeneficiario.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px] gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-muted-foreground truncate">{item.name}</span>
                    </div>
                    <span className="font-semibold flex-shrink-0">{fmt(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}