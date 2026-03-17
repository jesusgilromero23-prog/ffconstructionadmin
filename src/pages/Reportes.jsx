import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";
import { motion } from "framer-motion";
import { Download } from "lucide-react";
import { generateReporteAnual } from "@/lib/pdfGenerator";

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const COLORS = ["hsl(226,70%,55%)", "hsl(262,60%,55%)", "hsl(168,60%,45%)", "hsl(38,92%,50%)", "hsl(0,84%,60%)", "hsl(200,70%,50%)", "hsl(300,50%,50%)"];

export default function Reportes() {
  const currentYear = new Date().getFullYear();
  const [anio, setAnio] = useState(currentYear);
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const { data: gastos = [] } = useQuery({ queryKey: ["gastos"], queryFn: () => base44.entities.Gasto.list("-fecha", 500) });
  const { data: cheques = [] } = useQuery({ queryKey: ["cheques"], queryFn: () => base44.entities.Cheque.list("-fecha_emision", 500) });
  const { data: gastosProyecto = [] } = useQuery({ queryKey: ["gastosProyecto"], queryFn: () => base44.entities.GastoProyecto.list("-fecha", 500) });
  const { data: gastosTarjeta = [] } = useQuery({ queryKey: ["gastosTarjeta"], queryFn: () => base44.entities.GastoTarjeta.list("-fecha", 500) });

  const fG = gastos.filter(g => g.anio === anio);
  const fC = cheques.filter(c => c.anio === anio);
  const fP = gastosProyecto.filter(g => g.anio === anio);
  const fT = gastosTarjeta.filter(g => g.anio === anio);

  // Annual 12-month report
  const annualData = MESES.map((mes, i) => {
    const m = i + 1;
    return {
      mes,
      gastos: fG.filter(g => g.mes === m).reduce((s, g) => s + (g.monto || 0), 0),
      cheques: fC.filter(c => c.mes === m).reduce((s, c) => s + (c.monto || 0), 0),
      proyectos: fP.filter(g => g.mes === m).reduce((s, g) => s + (g.monto || 0), 0),
      tarjetas: fT.filter(g => g.mes === m).reduce((s, g) => s + (g.monto || 0), 0),
    };
  });

  annualData.forEach(d => { d.total = d.gastos + d.cheques + d.proyectos + d.tarjetas; });

  const grandTotal = annualData.reduce((s, d) => s + d.total, 0);

  // Category breakdown for gastos
  const catBreakdown = {};
  fG.forEach(g => { catBreakdown[g.categoria] = (catBreakdown[g.categoria] || 0) + (g.monto || 0); });
  const catData = Object.entries(catBreakdown).map(([name, value]) => ({ name, value }));

  // Project breakdown
  const projBreakdown = {};
  fP.forEach(g => { projBreakdown[g.proyecto] = (projBreakdown[g.proyecto] || 0) + (g.monto || 0); });
  const projData = Object.entries(projBreakdown).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Card breakdown
  const cardBreakdown = {};
  fT.forEach(g => { cardBreakdown[g.tarjeta] = (cardBreakdown[g.tarjeta] || 0) + (g.monto || 0); });
  const cardData = Object.entries(cardBreakdown).map(([name, value]) => ({ name, value }));

  // Cheque status
  const chequeStatus = {};
  fC.forEach(c => { chequeStatus[c.estado] = (chequeStatus[c.estado] || 0) + 1; });
  const chequeStatusData = Object.entries(chequeStatus).map(([name, value]) => ({ name, value }));

  const fmtMoney = (v) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Reportes" subtitle="Reportes mensuales y anuales con gráficas">
        <Select value={String(anio)} onValueChange={(v) => setAnio(Number(v))}>
          <SelectTrigger className="w-24 bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </PageHeader>

      {/* Annual Summary Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Reporte Anual {anio} — 12 Meses</h3>
          <span className="text-2xl font-bold">{fmtMoney(grandTotal)}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 font-semibold text-muted-foreground">Categoría</th>
                {MESES.map(m => <th key={m} className="text-right py-2 px-2 font-semibold text-muted-foreground">{m}</th>)}
                <th className="text-right py-2 px-2 font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Gastos Generales", key: "gastos" },
                { label: "Cheques", key: "cheques" },
                { label: "Proyectos", key: "proyectos" },
                { label: "Tarjetas", key: "tarjetas" },
              ].map(row => (
                <tr key={row.key} className="border-b border-border">
                  <td className="py-2 px-2 font-medium">{row.label}</td>
                  {annualData.map((d, i) => (
                    <td key={i} className="text-right py-2 px-2 text-muted-foreground">
                      {d[row.key] > 0 ? fmtMoney(d[row.key]) : "—"}
                    </td>
                  ))}
                  <td className="text-right py-2 px-2 font-bold">
                    {fmtMoney(annualData.reduce((s, d) => s + d[row.key], 0))}
                  </td>
                </tr>
              ))}
              <tr className="bg-muted/50 font-bold">
                <td className="py-2 px-2">Total</td>
                {annualData.map((d, i) => (
                  <td key={i} className="text-right py-2 px-2">{d.total > 0 ? fmtMoney(d.total) : "—"}</td>
                ))}
                <td className="text-right py-2 px-2">{fmtMoney(grandTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>

      <Tabs defaultValue="tendencia" className="space-y-6">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="tendencia">Tendencia Mensual</TabsTrigger>
          <TabsTrigger value="categorias">Por Categoría</TabsTrigger>
          <TabsTrigger value="proyectos">Por Proyecto</TabsTrigger>
          <TabsTrigger value="tarjetas">Por Tarjeta</TabsTrigger>
          <TabsTrigger value="cheques">Cheques</TabsTrigger>
        </TabsList>

        <TabsContent value="tendencia">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <h3 className="text-sm font-semibold mb-4">Tendencia Mensual de Gastos Totales</h3>
            <div className="h-80">
              <ResponsiveContainer>
                <LineChart data={annualData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => fmtMoney(v)} />
                  <Legend />
                  <Line type="monotone" dataKey="gastos" name="Gastos" stroke={COLORS[0]} strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="cheques" name="Cheques" stroke={COLORS[1]} strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="proyectos" name="Proyectos" stroke={COLORS[2]} strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="tarjetas" name="Tarjetas" stroke={COLORS[3]} strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="categorias">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <h3 className="text-sm font-semibold mb-4">Gastos Generales por Categoría</h3>
            <div className="h-80">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={catData} cx="50%" cy="50%" outerRadius={120} innerRadius={60} dataKey="value" paddingAngle={3} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                    {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmtMoney(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="proyectos">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <h3 className="text-sm font-semibold mb-4">Gastos por Proyecto</h3>
            <div className="h-80">
              <ResponsiveContainer>
                <BarChart data={projData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip formatter={(v) => fmtMoney(v)} />
                  <Bar dataKey="value" name="Monto" fill="hsl(226,70%,55%)" radius={[0,6,6,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="tarjetas">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <h3 className="text-sm font-semibold mb-4">Gastos por Tarjeta de Crédito</h3>
            <div className="h-80">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={cardData} cx="50%" cy="50%" outerRadius={120} innerRadius={60} dataKey="value" paddingAngle={3} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                    {cardData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmtMoney(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="cheques">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <h3 className="text-sm font-semibold mb-4">Estado de Cheques</h3>
              <div className="h-64">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={chequeStatusData} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" paddingAngle={4} label={({ name, value }) => `${name}: ${value}`}>
                      {chequeStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
              className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <h3 className="text-sm font-semibold mb-4">Cheques por Mes</h3>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={annualData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => fmtMoney(v)} />
                    <Bar dataKey="cheques" name="Cheques" fill="hsl(262,60%,55%)" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}