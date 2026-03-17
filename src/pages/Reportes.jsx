import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area,
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";
import { motion } from "framer-motion";
import { Download, Sparkles } from "lucide-react";
import { generateReporteAnual } from "@/lib/pdfGenerator";
import PLTable, { computePLSummary } from "@/components/reportes/PLTable";
import AIAnalysis from "@/components/reportes/AIAnalysis";

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const COLORS = [
  "hsl(226,70%,55%)", "hsl(262,60%,55%)", "hsl(168,60%,45%)",
  "hsl(38,92%,50%)", "hsl(0,84%,60%)", "hsl(200,70%,50%)", "hsl(300,50%,50%)"
];

const fmtMoney = (v) => `$${(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

export default function Reportes() {
  const currentYear = new Date().getFullYear();
  const [anio, setAnio] = useState(currentYear);
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const { data: gastos = [] } = useQuery({ queryKey: ["gastos"], queryFn: () => base44.entities.Gasto.list("-fecha", 500) });
  const { data: cheques = [] } = useQuery({ queryKey: ["cheques"], queryFn: () => base44.entities.Cheque.list("-fecha_emision", 500) });
  const { data: gastosProyecto = [] } = useQuery({ queryKey: ["gastosProyecto"], queryFn: () => base44.entities.GastoProyecto.list("-fecha", 500) });
  const { data: gastosTarjeta = [] } = useQuery({ queryKey: ["gastosTarjeta"], queryFn: () => base44.entities.GastoTarjeta.list("-fecha", 500) });
  const { data: depositos = [] } = useQuery({ queryKey: ["depositos"], queryFn: () => base44.entities.Deposito.list("-fecha", 500) });
  const { data: prestamos = [] } = useQuery({ queryKey: ["prestamos"], queryFn: () => base44.entities.Prestamo.list("-fecha_adquisicion", 200) });

  const fD = depositos.filter(d => d.anio === anio);
  const fG = gastos.filter(g => g.anio === anio);
  const fP = gastosProyecto.filter(g => g.anio === anio);
  const fT = gastosTarjeta.filter(g => g.anio === anio);
  const fC = cheques.filter(c => c.anio === anio);

  const plSummary = computePLSummary({ anio, depositos, gastos, gastosProyecto, gastosTarjeta });

  // Monthly chart data (ingresos vs gastos totales vs ganancia)
  const monthlyChart = MESES.map((mes, i) => {
    const m = i + 1;
    const ingresos = fD.filter(d => d.mes === m).reduce((s, d) => s + (d.monto || 0), 0);
    const gastosMes =
      fG.filter(g => g.mes === m).reduce((s, g) => s + (g.monto || 0), 0) +
      fP.filter(g => g.mes === m).reduce((s, g) => s + (g.monto || 0), 0) +
      fT.filter(g => g.mes === m).reduce((s, g) => s + (g.monto || 0), 0);
    return { mes, ingresos, gastos: gastosMes, ganancia: ingresos - gastosMes };
  });

  // Expense category breakdown (pie)
  const expenseBreakdown = [
    { name: "Labor", value: plSummary.labor },
    { name: "Materiales", value: plSummary.materiales },
    { name: "Oficina", value: plSummary.oficina },
    { name: "Seguros", value: plSummary.seguros },
    { name: "Vehículos/Gas", value: plSummary.vehiculos },
    { name: "Comida", value: plSummary.comida },
    { name: "Tarjetas", value: plSummary.tarjetas },
    { name: "Inversiones", value: plSummary.inversiones },
    { name: "Servicios/Bills", value: plSummary.servicios },
  ].filter(e => e.value > 0);

  // Monthly expenses breakdown stacked
  const stackedMonthly = MESES.map((mes, i) => {
    const m = i + 1;
    const labor = fP.filter(g => g.mes === m && (g.tipo_gasto === "labor" || g.tipo_gasto === "labor_extra")).reduce((s, g) => s + (g.monto || 0), 0);
    const materiales = fP.filter(g => g.mes === m && g.tipo_gasto === "material").reduce((s, g) => s + (g.monto || 0), 0) +
      fG.filter(g => g.mes === m && g.categoria === "materiales").reduce((s, g) => s + (g.monto || 0), 0);
    const oficina = fG.filter(g => g.mes === m && g.categoria === "oficina").reduce((s, g) => s + (g.monto || 0), 0);
    const seguros = fG.filter(g => g.mes === m && g.categoria === "seguros").reduce((s, g) => s + (g.monto || 0), 0);
    const vehiculos = fG.filter(g => g.mes === m && (g.categoria === "vehiculos" || g.categoria === "gasolina")).reduce((s, g) => s + (g.monto || 0), 0);
    const tarjetas = fT.filter(g => g.mes === m).reduce((s, g) => s + (g.monto || 0), 0);
    const otros = fG.filter(g => g.mes === m && (g.categoria === "servicios" || g.categoria === "otros" || g.categoria === "comida" || g.categoria === "inversiones")).reduce((s, g) => s + (g.monto || 0), 0) +
      fP.filter(g => g.mes === m && g.tipo_gasto === "operativo").reduce((s, g) => s + (g.monto || 0), 0);
    return { mes, labor, materiales, oficina, seguros, vehiculos, tarjetas, otros };
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Reportes Financieros" subtitle={`Estado de Resultados ${anio} — P&L Contable`}>
        <Select value={String(anio)} onValueChange={(v) => setAnio(Number(v))}>
          <SelectTrigger className="w-24 bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" className="gap-2" onClick={() => generateReporteAnual({ anio, depositos, gastos, gastosProyecto, gastosTarjeta, prestamos })}>
          <Download className="w-4 h-4" /> PDF Anual
        </Button>
      </PageHeader>

      <Tabs defaultValue="pl" className="space-y-6">
        <TabsList className="bg-card border border-border flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="pl">📊 P&L Mensual</TabsTrigger>
          <TabsTrigger value="graficas">📈 Gráficas Anuales</TabsTrigger>
          <TabsTrigger value="ia" className="gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Análisis IA
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: P&L Table ── */}
        <TabsContent value="pl">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base">Estado de Resultados {anio}</h3>
                <p className="text-xs text-muted-foreground">Ingresos, gastos desglosados y ganancia neta por mes</p>
              </div>
              <div className={`text-right ${plSummary.ganancia >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                <p className="text-xs text-muted-foreground">Ganancia Anual</p>
                <p className="text-2xl font-extrabold">
                  {plSummary.ganancia < 0 && "−"}{fmtMoney(Math.abs(plSummary.ganancia))}
                </p>
              </div>
            </div>
            <PLTable
              anio={anio}
              depositos={depositos}
              gastos={gastos}
              gastosProyecto={gastosProyecto}
              gastosTarjeta={gastosTarjeta}
            />
          </motion.div>
        </TabsContent>

        {/* ── TAB 2: Annual Charts ── */}
        <TabsContent value="graficas">
          <div className="space-y-6">

            {/* Ingresos vs Gastos vs Ganancia — Area chart */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <h3 className="text-sm font-semibold mb-4">Ingresos vs Gastos vs Ganancia — Mensual {anio}</h3>
              <div className="h-72">
                <ResponsiveContainer>
                  <AreaChart data={monthlyChart}>
                    <defs>
                      <linearGradient id="gIngresos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(168,60%,45%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(168,60%,45%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gGastos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(0,84%,60%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(0,84%,60%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => fmtMoney(v)} />
                    <Legend />
                    <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="hsl(168,60%,45%)" fill="url(#gIngresos)" strokeWidth={2} />
                    <Area type="monotone" dataKey="gastos" name="Gastos" stroke="hsl(0,84%,60%)" fill="url(#gGastos)" strokeWidth={2} />
                    <Line type="monotone" dataKey="ganancia" name="Ganancia" stroke="hsl(226,70%,55%)" strokeWidth={2.5} dot={{ r: 4 }} strokeDasharray="5 3" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Stacked bar by category */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                <h3 className="text-sm font-semibold mb-4">Gastos por Categoría — Mensual</h3>
                <div className="h-64">
                  <ResponsiveContainer>
                    <BarChart data={stackedMonthly}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                      <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v) => fmtMoney(v)} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Bar dataKey="labor" name="Labor" stackId="a" fill={COLORS[0]} />
                      <Bar dataKey="materiales" name="Materiales" stackId="a" fill={COLORS[2]} />
                      <Bar dataKey="vehiculos" name="Vehículos/Gas" stackId="a" fill={COLORS[3]} />
                      <Bar dataKey="tarjetas" name="Tarjetas" stackId="a" fill={COLORS[4]} />
                      <Bar dataKey="oficina" name="Oficina" stackId="a" fill={COLORS[1]} />
                      <Bar dataKey="otros" name="Otros" stackId="a" fill={COLORS[6]} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Pie — expense breakdown */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                <h3 className="text-sm font-semibold mb-4">Distribución de Gastos Anuales</h3>
                <div className="h-64">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={expenseBreakdown} cx="50%" cy="50%" outerRadius={90} innerRadius={45}
                        dataKey="value" paddingAngle={3}
                        label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ""}>
                        {expenseBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => fmtMoney(v)} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>

            {/* Ganancia neta bar chart */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <h3 className="text-sm font-semibold mb-4">Ganancia Neta por Mes</h3>
              <div className="h-56">
                <ResponsiveContainer>
                  <BarChart data={monthlyChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => fmtMoney(v)} />
                    <Bar dataKey="ganancia" name="Ganancia Neta" radius={[4, 4, 0, 0]}
                      fill="hsl(226,70%,55%)"
                      label={false}
                    >
                      {monthlyChart.map((d, i) => (
                        <Cell key={i} fill={d.ganancia >= 0 ? "hsl(168,60%,45%)" : "hsl(0,84%,60%)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>
        </TabsContent>

        {/* ── TAB 3: AI Analysis ── */}
        <TabsContent value="ia">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <AIAnalysis summary={plSummary} anio={anio} />
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}