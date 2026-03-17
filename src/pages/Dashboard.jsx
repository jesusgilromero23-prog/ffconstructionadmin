import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Receipt, FileCheck, FolderKanban, CreditCard, TrendingUp, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import StatCard from "@/components/shared/StatCard";
import PageHeader from "@/components/shared/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";

const MESES_CORTOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const COLORS = ["hsl(226,70%,55%)", "hsl(262,60%,55%)", "hsl(168,60%,45%)", "hsl(38,92%,50%)", "hsl(0,84%,60%)"];

export default function Dashboard() {
  const currentYear = new Date().getFullYear();
  const [anio, setAnio] = React.useState(currentYear);

  const { data: gastos = [] } = useQuery({
    queryKey: ["gastos"], queryFn: () => base44.entities.Gasto.list("-fecha", 500),
  });
  const { data: cheques = [] } = useQuery({
    queryKey: ["cheques"], queryFn: () => base44.entities.Cheque.list("-fecha_emision", 500),
  });
  const { data: gastosProyecto = [] } = useQuery({
    queryKey: ["gastosProyecto"], queryFn: () => base44.entities.GastoProyecto.list("-fecha", 500),
  });
  const { data: gastosTarjeta = [] } = useQuery({
    queryKey: ["gastosTarjeta"], queryFn: () => base44.entities.GastoTarjeta.list("-fecha", 500),
  });

  const filteredGastos = gastos.filter(g => g.anio === anio);
  const filteredCheques = cheques.filter(c => c.anio === anio);
  const filteredProyectos = gastosProyecto.filter(g => g.anio === anio);
  const filteredTarjetas = gastosTarjeta.filter(g => g.anio === anio);

  const totalGastos = filteredGastos.reduce((s, g) => s + (g.monto || 0), 0);
  const totalCheques = filteredCheques.reduce((s, c) => s + (c.monto || 0), 0);
  const totalProyectos = filteredProyectos.reduce((s, g) => s + (g.monto || 0), 0);
  const totalTarjetas = filteredTarjetas.reduce((s, g) => s + (g.monto || 0), 0);
  const granTotal = totalGastos + totalCheques + totalProyectos + totalTarjetas;

  // Monthly trend data
  const monthlyData = MESES_CORTOS.map((mes, i) => {
    const m = i + 1;
    return {
      name: mes,
      gastos: filteredGastos.filter(g => g.mes === m).reduce((s, g) => s + (g.monto || 0), 0),
      cheques: filteredCheques.filter(c => c.mes === m).reduce((s, c) => s + (c.monto || 0), 0),
      proyectos: filteredProyectos.filter(g => g.mes === m).reduce((s, g) => s + (g.monto || 0), 0),
      tarjetas: filteredTarjetas.filter(g => g.mes === m).reduce((s, g) => s + (g.monto || 0), 0),
    };
  });

  // Category distribution
  const catData = [
    { name: "Gastos Generales", value: totalGastos },
    { name: "Cheques", value: totalCheques },
    { name: "Proyectos", value: totalProyectos },
    { name: "Tarjetas", value: totalTarjetas },
  ].filter(d => d.value > 0);

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Dashboard" subtitle="Resumen general de gastos y control contable">
        <Select value={String(anio)} onValueChange={(v) => setAnio(Number(v))}>
          <SelectTrigger className="w-24 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard title="Total General" value={`$${granTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} icon={DollarSign} color="primary" />
        <StatCard title="Gastos Generales" value={`$${totalGastos.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} icon={Receipt} color="chart3" />
        <StatCard title="Cheques Emitidos" value={`$${totalCheques.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} icon={FileCheck} color="accent" />
        <StatCard title="Gastos Proyectos" value={`$${totalProyectos.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} icon={FolderKanban} color="chart4" />
        <StatCard title="Tarjetas Crédito" value={`$${totalTarjetas.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} icon={CreditCard} color="destructive" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-4">Tendencia Mensual {anio}</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="gGastos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(226,70%,55%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(226,70%,55%)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gCheques" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(262,60%,55%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(262,60%,55%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} />
                <Area type="monotone" dataKey="gastos" name="Gastos" stroke="hsl(226,70%,55%)" fill="url(#gGastos)" strokeWidth={2} />
                <Area type="monotone" dataKey="cheques" name="Cheques" stroke="hsl(262,60%,55%)" fill="url(#gCheques)" strokeWidth={2} />
                <Area type="monotone" dataKey="proyectos" name="Proyectos" stroke="hsl(168,60%,45%)" fill="transparent" strokeWidth={2} />
                <Area type="monotone" dataKey="tarjetas" name="Tarjetas" stroke="hsl(38,92%,50%)" fill="transparent" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Pie chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-4">Distribución de Gastos</h3>
          <div className="h-56">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={catData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={4}>
                  {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {catData.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-medium">${item.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Monthly breakdown bar */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-card rounded-2xl border border-border p-6 shadow-sm mt-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Desglose Mensual por Categoría</h3>
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} />
              <Bar dataKey="gastos" name="Gastos" fill="hsl(226,70%,55%)" radius={[4,4,0,0]} />
              <Bar dataKey="cheques" name="Cheques" fill="hsl(262,60%,55%)" radius={[4,4,0,0]} />
              <Bar dataKey="proyectos" name="Proyectos" fill="hsl(168,60%,45%)" radius={[4,4,0,0]} />
              <Bar dataKey="tarjetas" name="Tarjetas" fill="hsl(38,92%,50%)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}