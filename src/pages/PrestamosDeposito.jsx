import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { motion } from "framer-motion";
import { Building2, Calendar, Percent, Clock } from "lucide-react";

const fmt = (v) => `$${(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

export default function PrestamosDeposito() {
  const currentYear = new Date().getFullYear();
  const [anio, setAnio] = useState(currentYear);

  const { data: depositos = [] } = useQuery({
    queryKey: ["depositos"],
    queryFn: () => base44.entities.Deposito.list("-fecha", 500),
  });

  const prestamos = depositos.filter(d => d.tipo === "prestamo");
  const filtrados = anio === 0 ? prestamos : prestamos.filter(p => p.anio === anio);
  const totalPrestado = filtrados.reduce((s, p) => s + (p.monto || 0), 0);

  const years = Array.from({ length: 6 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Préstamos Recibidos" subtitle="Control de depósitos tipo préstamo y sus condiciones">
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Total Prestado</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{fmt(totalPrestado)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{filtrados.length} préstamo(s)</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Promedio por Préstamo</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">
            {filtrados.length > 0 ? fmt(totalPrestado / filtrados.length) : "$0.00"}
          </p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5">
          <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Entidades</p>
          <p className="text-2xl font-bold text-purple-700 mt-1">
            {new Set(filtrados.map(p => p.prestamo_entidad).filter(Boolean)).size}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">prestamistas distintos</p>
        </div>
      </div>

      {filtrados.length === 0 ? (
        <EmptyState message="No hay préstamos registrados. Agrega depósitos con tipo 'Préstamo' en la sección de Depósitos." />
      ) : (
        <div className="space-y-4">
          {filtrados.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-blue-100 text-blue-700 text-xs">Préstamo</Badge>
                    {p.prestamo_entidad && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> {p.prestamo_entidad}
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-base">{p.descripcion}</p>
                  <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(p.fecha), "dd/MM/yyyy")}
                    </span>
                    {p.prestamo_tasa > 0 && (
                      <span className="flex items-center gap-1">
                        <Percent className="w-3 h-3" /> {p.prestamo_tasa}% interés
                      </span>
                    )}
                    {p.prestamo_plazo > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {p.prestamo_plazo} meses
                      </span>
                    )}
                    {p.banco && <span>Banco: {p.banco}</span>}
                  </div>
                  {p.notas && <p className="text-xs text-muted-foreground mt-1 italic">{p.notas}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-2xl font-bold text-blue-700">{fmt(p.monto)}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}