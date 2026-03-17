import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowDownCircle, Users, Package, Building2, ShieldCheck, 
  CreditCard, Truck, Utensils, TrendingUp, Landmark, DollarSign, MinusCircle
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, Legend 
} from "recharts";
import PageHeader from "@/components/shared/PageHeader";
import NotificationsPanel from "@/components/dashboard/NotificationsPanel";
import AccessRequestBanner from "@/components/dashboard/AccessRequestBanner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";

const MESES_CORTOS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const COLORS = ["hsl(226,70%,55%)","hsl(168,60%,45%)","hsl(262,60%,55%)","hsl(38,92%,50%)","hsl(0,84%,60%)","hsl(200,70%,50%)","hsl(300,50%,50%)"];

function KpiCard({ title, value, icon: Icon, color, sub, positive }) {
  const colorMap = {
    green:  { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100" },
    red:    { bg: "bg-red-50", text: "text-red-500", border: "border-red-100" },
    blue:   { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100" },
    amber:  { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100" },
    purple: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-100" },
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-100" },
    slate:  { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" },
  };
  const c = colorMap[color] || colorMap.blue;
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className={`bg-card rounded-2xl p-4 border ${c.border} shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate">{title}</p>
          <p className={`text-xl font-bold mt-1 ${positive === false ? "text-red-500" : positive === true ? "text-emerald-600" : "text-foreground"}`}>{value}</p>
          {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.bg}`}>
          <Icon className={`w-4.5 h-4.5 ${c.text}`} style={{ width: 18, height: 18 }} />
        </div>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const currentYear = new Date().getFullYear();
  const [anio, setAnio] = useState(currentYear);
  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me(), staleTime: 60000 });
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  const fmt = (v) => `$${(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  const { data: depositos = [] } = useQuery({ queryKey: ["depositos"], queryFn: () => base44.entities.Deposito.list("-fecha", 500) });
  const { data: gastos = [] } = useQuery({ queryKey: ["gastos"], queryFn: () => base44.entities.Gasto.list("-fecha", 500) });
  const { data: cheques = [] } = useQuery({ queryKey: ["cheques"], queryFn: () => base44.entities.Cheque.list("-fecha_emision", 500) });
  const { data: gastosProyecto = [] } = useQuery({ queryKey: ["gastosProyecto"], queryFn: () => base44.entities.GastoProyecto.list("-fecha", 500) });
  const { data: gastosTarjeta = [] } = useQuery({ queryKey: ["gastosTarjeta"], queryFn: () => base44.entities.GastoTarjeta.list("-fecha", 500) });
  const { data: prestamos = [] } = useQuery({ queryKey: ["prestamos"], queryFn: () => base44.entities.Prestamo.list("-fecha_adquisicion", 200) });
  const { data: pagosDeuda = [] } = useQuery({ queryKey: ["pagosDeuda"], queryFn: () => base44.entities.PagoDeuda.list("-fecha", 200) });
  const { data: contratos = [] } = useQuery({ queryKey: ["contratos"], queryFn: () => base44.entities.ContratoProyecto.list("-fecha_contrato", 200) });

  // Filter by year
  const fDep  = depositos.filter(d => d.anio === anio);
  const fGas  = gastos.filter(g => g.anio === anio);
  const fChe  = cheques.filter(c => c.anio === anio);
  const fGP   = gastosProyecto.filter(g => g.anio === anio);
  const fTar  = gastosTarjeta.filter(g => g.anio === anio);
  const fPDeu = pagosDeuda.filter(p => p.anio === anio);
  const fPres = prestamos.filter(p => p.anio === anio);

  // KPI calculations
  const totalDepositos    = fDep.reduce((s,d) => s + (d.monto||0), 0);
  const totalLabor        = [...fChe, ...fGP.filter(g => g.tipo_gasto === "labor"), ...fGP.filter(g => g.tipo_gasto === "labor_extra")].reduce((s,x) => s + (x.monto||0), 0);
  const totalMateriales   = fGas.filter(g => g.categoria === "materiales").reduce((s,g) => s+(g.monto||0),0) + fGP.filter(g=>g.tipo_gasto==="material").reduce((s,g) => s+(g.monto||0),0);
  const totalOficina      = fGas.filter(g => g.categoria === "oficina").reduce((s,g) => s+(g.monto||0),0);
  const totalSeguros      = fGas.filter(g => g.categoria === "seguros").reduce((s,g) => s+(g.monto||0),0);
  const totalTarjeta      = fTar.reduce((s,g) => s+(g.monto||0),0);
  const totalVehiculos    = fGas.filter(g => g.categoria === "vehiculos").reduce((s,g) => s+(g.monto||0),0) + fGas.filter(g=>g.categoria==="gasolina").reduce((s,g) => s+(g.monto||0),0);
  const totalServicios    = fGas.filter(g => g.categoria === "servicios").reduce((s,g) => s+(g.monto||0),0);
  const totalComida       = fGas.filter(g => g.categoria === "comida").reduce((s,g) => s+(g.monto||0),0) + fTar.filter(g=>g.categoria==="comidas").reduce((s,g) => s+(g.monto||0),0);
  const totalInversiones  = fGas.filter(g => g.categoria === "inversiones").reduce((s,g) => s+(g.monto||0),0);
  const totalPagosDeuda   = fPDeu.reduce((s,p) => s+(p.monto||0),0);
  const totalPrestamoAdq  = fPres.reduce((s,p) => s+(p.monto_adquirido||0),0);
  const totalContratos    = contratos.filter(c => c.anio === anio).reduce((s,c) => s+(c.monto_contrato||0),0);
  const totalGastosProySin = fGP.reduce((s,g) => s+(g.monto||0),0);

  const totalEgresos = totalLabor + totalMateriales + totalOficina + totalSeguros + totalTarjeta + totalVehiculos + totalServicios + totalComida + totalInversiones + totalPagosDeuda + fGas.filter(g=>g.categoria==="otros").reduce((s,g)=>s+(g.monto||0),0);
  const utilidad = totalDepositos - totalEgresos;

  // Monthly trend
  const monthly = MESES_CORTOS.map((mes, i) => {
    const m = i + 1;
    const ingresos = fDep.filter(d => d.mes === m).reduce((s,d) => s+(d.monto||0),0);
    const egresos = [
      ...fGas.filter(g => g.mes === m),
      ...fChe.filter(c => c.mes === m),
      ...fGP.filter(g => g.mes === m),
      ...fTar.filter(g => g.mes === m),
      ...fPDeu.filter(p => p.mes === m),
    ].reduce((s,x) => s+(x.monto||0),0);
    return { mes, ingresos, egresos, utilidad: ingresos - egresos };
  });

  // Pie breakdown egresos
  const pieData = [
    { name: "Labor", value: totalLabor },
    { name: "Materiales", value: totalMateriales },
    { name: "Oficina", value: totalOficina },
    { name: "Seguros", value: totalSeguros },
    { name: "Tarjetas", value: totalTarjeta },
    { name: "Vehículos", value: totalVehiculos },
    { name: "Servicios", value: totalServicios },
    { name: "Comida", value: totalComida },
    { name: "Inversiones", value: totalInversiones },
    { name: "Pagos Deuda", value: totalPagosDeuda },
  ].filter(d => d.value > 0);

  const kpis = [
    { title: "Depósitos / Ingresos", value: fmt(totalDepositos), icon: ArrowDownCircle, color: "green", positive: true, sub: "Dinero entrante" },
    { title: "Labor (Empleados)", value: fmt(totalLabor), icon: Users, color: "blue", positive: false, sub: "Cheques + nóminas" },
    { title: "Materiales", value: fmt(totalMateriales), icon: Package, color: "amber", positive: false, sub: "Gral + proyectos" },
    { title: "Gastos de Oficina", value: fmt(totalOficina), icon: Building2, color: "indigo", positive: false, sub: "Suministros oficina" },
    { title: "Seguros", value: fmt(totalSeguros), icon: ShieldCheck, color: "purple", positive: false, sub: "Pólizas y primas" },
    { title: "Tarjetas Crédito", value: fmt(totalTarjeta), icon: CreditCard, color: "red", positive: false, sub: "Cargos a tarjetas" },
    { title: "Vehículos / Gasolina", value: fmt(totalVehiculos), icon: Truck, color: "slate", positive: false, sub: "Flota + combustible" },
    { title: "Servicios", value: fmt(totalServicios), icon: Landmark, color: "blue", positive: false, sub: "Servicios contratados" },
    { title: "Comida", value: fmt(totalComida), icon: Utensils, color: "amber", positive: false, sub: "Alimentos y dietas" },
    { title: "Inversiones", value: fmt(totalInversiones), icon: TrendingUp, color: "green", positive: null, sub: "Capital invertido" },
    { title: "Pagos de Deuda", value: fmt(totalPagosDeuda), icon: MinusCircle, color: "red", positive: false, sub: "Préstamos y créditos" },
    { title: "Crédito Adquirido", value: fmt(totalPrestamoAdq), icon: DollarSign, color: "purple", positive: null, sub: "Préstamos recibidos" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Dashboard Contable" subtitle="Resumen financiero completo de la empresa">
        <Select value={String(anio)} onValueChange={(v) => setAnio(Number(v))}>
          <SelectTrigger className="w-24 bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
        </Select>
      </PageHeader>

      {user?.role !== "admin" && <AccessRequestBanner user={user} />}
      <NotificationsPanel
        prestamos={prestamos}
        cheques={cheques}
        contratos={contratos}
        gastosProyecto={gastosProyecto}
      />

      {/* Utilidad Banner */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl p-5 mb-6 flex items-center justify-between border shadow-sm ${utilidad >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resultado Neto {anio}</p>
          <p className={`text-3xl font-bold mt-1 ${utilidad >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{fmt(utilidad)}</p>
          <p className="text-xs text-muted-foreground mt-1">Ingresos {fmt(totalDepositos)} — Egresos {fmt(totalEgresos)}</p>
        </div>
        <div className={`text-5xl font-black opacity-20 ${utilidad >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {utilidad >= 0 ? "+" : "−"}
        </div>
      </motion.div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 mb-8">
        {kpis.map((k, i) => (
          <motion.div key={k.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <KpiCard {...k} />
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Area chart ingresos vs egresos */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h3 className="text-sm font-semibold mb-4">Ingresos vs Egresos — Mensual {anio}</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="gIng" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(168,60%,45%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(168,60%,45%)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gEgr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(0,84%,60%)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="hsl(0,84%,60%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => fmt(v)} />
                <Legend />
                <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="hsl(168,60%,45%)" fill="url(#gIng)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="egresos" name="Egresos" stroke="hsl(0,84%,60%)" fill="url(#gEgr)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Pie egresos */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h3 className="text-sm font-semibold mb-4">Distribución de Egresos</h3>
          <div className="h-48">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-1 max-h-40 overflow-y-auto">
            {pieData.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-semibold">{fmt(item.value)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bar chart utilidad mensual */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="bg-card rounded-2xl border border-border p-6 shadow-sm mb-6">
        <h3 className="text-sm font-semibold mb-4">Utilidad Neta Mensual {anio}</h3>
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => fmt(v)} />
              <Bar dataKey="utilidad" name="Utilidad" radius={[6,6,0,0]}>
                {monthly.map((d, i) => (
                  <Cell key={i} fill={d.utilidad >= 0 ? "hsl(168,60%,45%)" : "hsl(0,84%,60%)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Proyectos summary */}
      {contratos.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h3 className="text-sm font-semibold mb-4">Resumen de Proyectos en Ejecución</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
              <p className="text-xs text-muted-foreground">Total Contratos</p>
              <p className="text-xl font-bold text-emerald-700 mt-1">{fmt(totalContratos)}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4 border border-red-100">
              <p className="text-xs text-muted-foreground">Total Gastos Proyectos</p>
              <p className="text-xl font-bold text-red-600 mt-1">{fmt(totalGastosProySin)}</p>
            </div>
            <div className={`rounded-xl p-4 border ${totalContratos - totalGastosProySin >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'}`}>
              <p className="text-xs text-muted-foreground">Ganancia Proyectos</p>
              <p className={`text-xl font-bold mt-1 ${totalContratos - totalGastosProySin >= 0 ? 'text-blue-700' : 'text-orange-600'}`}>{fmt(totalContratos - totalGastosProySin)}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}