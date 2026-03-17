import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfWeek, addWeeks, subWeeks } from "date-fns";
import { es } from "date-fns/locale";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function PeriodFilter({ vista, setVista, anio, setAnio, mes, setMes, weekStart, setWeekStart }) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Vista toggle */}
      <div className="flex rounded-lg border border-border overflow-hidden bg-card">
        {["anual", "mensual", "semanal"].map(v => (
          <button
            key={v}
            onClick={() => setVista(v)}
            className={`px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
              vista === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {v === "anual" ? "Año" : v === "mensual" ? "Mes" : "Semana"}
          </button>
        ))}
      </div>

      {/* Year always shown */}
      <Select value={String(anio)} onValueChange={(v) => setAnio(Number(v))}>
        <SelectTrigger className="w-24 bg-card h-8 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
      </Select>

      {/* Month selector (mensual) */}
      {vista === "mensual" && (
        <Select value={String(mes)} onValueChange={(v) => setMes(Number(v))}>
          <SelectTrigger className="w-32 bg-card h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {MESES.map((m, i) => <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
      )}

      {/* Week navigation (semanal) */}
      {vista === "semanal" && (
        <div className="flex items-center gap-1 bg-card border border-border rounded-lg px-2 py-1">
          <button onClick={() => setWeekStart(subWeeks(weekStart, 1))} className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-medium px-1">
            {format(weekStart, "d MMM", { locale: es })} — {format(weekEnd, "d MMM", { locale: es })}
          </span>
          <button onClick={() => setWeekStart(addWeeks(weekStart, 1))} className="text-muted-foreground hover:text-foreground">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}