import React, { useState } from "react";
import { AlertTriangle, Clock, TrendingUp, X, Bell, ChevronDown, ChevronUp } from "lucide-react";
import { differenceInDays, addMonths, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

function AlertItem({ icon: Icon, color, title, description, tag }) {
  const colors = {
    red: "bg-red-50 border-red-200 text-red-700",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
    orange: "bg-orange-50 border-orange-200 text-orange-700",
  };
  const iconColors = {
    red: "text-red-500",
    amber: "text-amber-500",
    orange: "text-orange-500",
  };
  const tagColors = {
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-700",
    orange: "bg-orange-100 text-orange-700",
  };

  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${colors[color]}`}>
      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${iconColors[color]}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold">{title}</p>
        <p className="text-[11px] opacity-80 mt-0.5">{description}</p>
      </div>
      {tag && (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${tagColors[color]}`}>{tag}</span>
      )}
    </div>
  );
}

export default function NotificationsPanel({ prestamos, cheques, contratos, gastosProyecto }) {
  const [open, setOpen] = useState(true);
  const today = new Date();

  const alerts = [];

  // 1. Cheques sin cobrar > 30 días
  cheques
    .filter(c => c.estado === "emitido" || c.estado === "pendiente")
    .forEach(c => {
      const days = differenceInDays(today, parseISO(c.fecha_emision));
      if (days > 30) {
        alerts.push({
          type: "cheque",
          color: "amber",
          icon: Clock,
          title: `Cheque #${c.numero_cheque} — ${c.beneficiario}`,
          description: `Emitido hace ${days} días sin ser cobrado. Monto: $${(c.monto || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
          tag: `${days}d`,
          priority: days,
        });
      }
    });

  // 2. Préstamos con vencimiento próximo (dentro de 30 días)
  prestamos
    .filter(p => p.estado === "activo" && p.plazo_meses && p.fecha_adquisicion)
    .forEach(p => {
      const vencimiento = addMonths(parseISO(p.fecha_adquisicion), p.plazo_meses);
      const daysLeft = differenceInDays(vencimiento, today);
      if (daysLeft >= 0 && daysLeft <= 30) {
        alerts.push({
          type: "prestamo",
          color: "red",
          icon: AlertTriangle,
          title: `Préstamo vence pronto — ${p.entidad || p.descripcion}`,
          description: `Vence el ${vencimiento.toLocaleDateString("es-US")}. Monto: $${(p.monto_adquirido || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
          tag: daysLeft === 0 ? "HOY" : `${daysLeft}d`,
          priority: 10000 - daysLeft,
        });
      } else if (daysLeft < 0) {
        alerts.push({
          type: "prestamo",
          color: "red",
          icon: AlertTriangle,
          title: `Préstamo VENCIDO — ${p.entidad || p.descripcion}`,
          description: `Venció hace ${Math.abs(daysLeft)} días. Monto original: $${(p.monto_adquirido || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
          tag: "VENCIDO",
          priority: 99999,
        });
      }
    });

  // 3. Contratos al 90% del presupuesto (gastos >= 90% del monto_contrato)
  contratos.forEach(contrato => {
    const gastosDelContrato = gastosProyecto.filter(g => g.proyecto === contrato.proyecto_nombre);
    const totalGastos = gastosDelContrato.reduce((s, g) => s + (g.monto || 0), 0);
    const pct = contrato.monto_contrato > 0 ? (totalGastos / contrato.monto_contrato) * 100 : 0;
    if (pct >= 90) {
      const isOver = pct > 100;
      alerts.push({
        type: "contrato",
        color: isOver ? "red" : "orange",
        icon: TrendingUp,
        title: `${isOver ? "Presupuesto excedido" : "Presupuesto al límite"} — ${contrato.proyecto_nombre}`,
        description: `Contrato ${contrato.tipo_contrato}: gastado $${totalGastos.toLocaleString("en-US", { minimumFractionDigits: 2 })} de $${(contrato.monto_contrato || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        tag: `${pct.toFixed(0)}%`,
        priority: pct,
      });
    }
  });

  if (alerts.length === 0) return null;

  const sorted = alerts.sort((a, b) => b.priority - a.priority);

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-amber-200 shadow-sm mb-6 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Bell className="w-5 h-5 text-amber-500" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {alerts.length}
            </span>
          </div>
          <span className="text-sm font-semibold text-foreground">
            Alertas del Sistema
          </span>
          <span className="text-[11px] text-muted-foreground">
            {alerts.length} notificación{alerts.length !== 1 ? "es" : ""} activa{alerts.length !== 1 ? "s" : ""}
          </span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
              {sorted.map((alert, i) => (
                <AlertItem key={i} {...alert} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}