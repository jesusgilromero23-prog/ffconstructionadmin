import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function MonthYearFilter({ mes, anio, onMesChange, onAnioChange }) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="flex items-center gap-2">
      <Select value={String(mes)} onValueChange={(v) => onMesChange(Number(v))}>
        <SelectTrigger className="w-36 bg-card">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="0">Todos los meses</SelectItem>
          {MESES.map((m, i) => (
            <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={String(anio)} onValueChange={(v) => onAnioChange(Number(v))}>
        <SelectTrigger className="w-24 bg-card">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}