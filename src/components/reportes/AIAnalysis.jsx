import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function AIAnalysis({ summary, anio }) {
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const fmt = (v) => `$${v.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  const margen = summary.ingresos > 0 ? ((summary.ganancia / summary.ingresos) * 100).toFixed(1) : 0;

  const handleAnalyze = async () => {
    setLoading(true);
    setAnalysis("");
    try {
      const prompt = `Eres un contador y asesor financiero experto. Analiza el siguiente reporte financiero anual ${anio} de una empresa de construcción/contratación y proporciona un análisis detallado en español.

**DATOS FINANCIEROS ${anio}:**
- Ingresos (Depósitos): ${fmt(summary.ingresos)}
- Labor (mano de obra): ${fmt(summary.labor)}
- Gastos Materiales: ${fmt(summary.materiales)}
- Gastos Oficina: ${fmt(summary.oficina)}
- Gastos Seguros: ${fmt(summary.seguros)}
- Gastos Vehículos / Gasolina: ${fmt(summary.vehiculos)}
- Gastos Comida: ${fmt(summary.comida)}
- Pagos Tarjeta de Crédito: ${fmt(summary.tarjetas)}
- Inversiones: ${fmt(summary.inversiones)}
- Servicios / Bills (Gastos Generales): ${fmt(summary.servicios)}
- **Total Gastos: ${fmt(summary.totalGastos)}**
- **Ganancia Neta: ${fmt(summary.ganancia)}**
- Margen de Ganancia: ${margen}%

Proporciona:
1. **Resumen Ejecutivo** — evaluación general del desempeño financiero
2. **Puntos Críticos** — gastos que destacan o preocupan
3. **Eficiencia Operativa** — relación labor vs ingresos, margen de ganancia
4. **Recomendaciones** — al menos 3 acciones concretas para mejorar la rentabilidad
5. **Perspectiva** — comparación con estándares del sector construcción

Sé específico, usa los números reales y da consejos prácticos y accionables.`;

      const result = await base44.integrations.Core.InvokeLLM({ prompt });
      setAnalysis(result);
    } catch (err) {
      setAnalysis("Error al generar el análisis. Por favor intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Análisis IA — Reporte {anio}</h3>
            <p className="text-xs text-muted-foreground">Análisis financiero inteligente de tu P&L anual</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {analysis && (
            <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground hover:text-foreground">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
          <Button
            onClick={handleAnalyze}
            disabled={loading}
            size="sm"
            className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {loading ? "Analizando..." : analysis ? "Re-analizar" : "Analizar con IA"}
          </Button>
        </div>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span className="text-xs bg-emerald-100 text-emerald-700 rounded-full px-2.5 py-0.5 font-medium">
          Ingresos: {fmt(summary.ingresos)}
        </span>
        <span className="text-xs bg-red-100 text-red-700 rounded-full px-2.5 py-0.5 font-medium">
          Gastos: {fmt(summary.totalGastos)}
        </span>
        <span className={`text-xs rounded-full px-2.5 py-0.5 font-bold ${summary.ganancia >= 0 ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>
          {summary.ganancia >= 0 ? "Ganancia" : "Pérdida"}: {fmt(Math.abs(summary.ganancia))} ({margen}%)
        </span>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-indigo-700 bg-white/60 rounded-xl px-4 py-3">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
          Generando análisis financiero con IA...
        </div>
      )}

      {analysis && expanded && (
        <div className="bg-white/80 rounded-xl p-4 text-sm prose prose-sm max-w-none prose-headings:text-foreground prose-headings:font-bold prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground">
          <ReactMarkdown>{analysis}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}