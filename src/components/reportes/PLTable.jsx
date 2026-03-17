import React from "react";

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const fmt = (v) => v > 0 ? `$${v.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "—";

function sumByMes(items, mes, filterFn = null) {
  return items
    .filter(i => i.mes === mes && (!filterFn || filterFn(i)))
    .reduce((s, i) => s + (i.monto || 0), 0);
}

export default function PLTable({ anio, depositos, gastos, gastosProyecto, gastosTarjeta }) {
  const fD = depositos.filter(d => d.anio === anio);
  const fG = gastos.filter(g => g.anio === anio);
  const fP = gastosProyecto.filter(g => g.anio === anio);
  const fT = gastosTarjeta.filter(g => g.anio === anio);

  const rows = [
    {
      label: "✦ Depósitos (Ingresos)",
      type: "income",
      values: MESES.map((_, i) => sumByMes(fD, i + 1)),
    },
    {
      label: "Labor",
      type: "expense",
      values: MESES.map((_, i) => sumByMes(fP, i + 1, g => g.tipo_gasto === "labor" || g.tipo_gasto === "labor_extra")),
    },
    {
      label: "Gastos Materiales",
      type: "expense",
      values: MESES.map((_, i) =>
        sumByMes(fP, i + 1, g => g.tipo_gasto === "material") +
        sumByMes(fG, i + 1, g => g.categoria === "materiales")
      ),
    },
    {
      label: "Gastos Oficina",
      type: "expense",
      values: MESES.map((_, i) => sumByMes(fG, i + 1, g => g.categoria === "oficina")),
    },
    {
      label: "Gastos Seguros",
      type: "expense",
      values: MESES.map((_, i) => sumByMes(fG, i + 1, g => g.categoria === "seguros")),
    },
    {
      label: "Gastos Vehículos / Gasolina",
      type: "expense",
      values: MESES.map((_, i) =>
        sumByMes(fG, i + 1, g => g.categoria === "vehiculos") +
        sumByMes(fG, i + 1, g => g.categoria === "gasolina")
      ),
    },
    {
      label: "Gastos Comida",
      type: "expense",
      values: MESES.map((_, i) => sumByMes(fG, i + 1, g => g.categoria === "comida")),
    },
    {
      label: "Pagos Tarjeta de Crédito",
      type: "expense",
      values: MESES.map((_, i) => sumByMes(fT, i + 1)),
    },
    {
      label: "Inversiones",
      type: "expense",
      values: MESES.map((_, i) => sumByMes(fG, i + 1, g => g.categoria === "inversiones")),
    },
    {
      label: "Servicios / Bills (Gastos Generales)",
      type: "expense",
      values: MESES.map((_, i) =>
        sumByMes(fG, i + 1, g => g.categoria === "servicios") +
        sumByMes(fG, i + 1, g => g.categoria === "otros") +
        sumByMes(fP, i + 1, g => g.tipo_gasto === "operativo")
      ),
    },
  ];

  // Total expenses per month
  const totalExpenses = MESES.map((_, i) =>
    rows.filter(r => r.type === "expense").reduce((s, r) => s + r.values[i], 0)
  );

  const ingresos = rows[0].values;
  const ganancias = MESES.map((_, i) => ingresos[i] - totalExpenses[i]);

  const rowTotal = (values) => values.reduce((s, v) => s + v, 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs min-w-[900px]">
        <thead>
          <tr className="border-b-2 border-border bg-muted/60">
            <th className="text-left py-2.5 px-3 font-bold text-sm">Concepto</th>
            {MESES.map(m => (
              <th key={m} className="text-right py-2.5 px-2 font-semibold text-muted-foreground">{m}</th>
            ))}
            <th className="text-right py-2.5 px-3 font-bold">Anual</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => {
            const total = rowTotal(row.values);
            const isIncome = row.type === "income";
            const isSeparator = ri === 0; // after income row add spacing
            return (
              <React.Fragment key={row.label}>
                <tr className={`border-b border-border transition-colors hover:bg-muted/20 ${isIncome ? "bg-emerald-50/60" : ""}`}>
                  <td className={`py-2 px-3 font-medium ${isIncome ? "text-emerald-700 font-bold" : "text-foreground"}`}>
                    {row.label}
                  </td>
                  {row.values.map((v, i) => (
                    <td key={i} className={`text-right py-2 px-2 ${isIncome ? "text-emerald-600 font-semibold" : "text-muted-foreground"}`}>
                      {fmt(v)}
                    </td>
                  ))}
                  <td className={`text-right py-2 px-3 font-bold ${isIncome ? "text-emerald-700" : ""}`}>
                    {fmt(total)}
                  </td>
                </tr>
                {isSeparator && (
                  <tr>
                    <td colSpan={15} className="py-0.5 bg-border/30" />
                  </tr>
                )}
              </React.Fragment>
            );
          })}

          {/* Total Gastos row */}
          <tr className="border-b-2 border-border bg-red-50/40">
            <td className="py-2 px-3 font-bold text-red-700">Total Gastos</td>
            {totalExpenses.map((v, i) => (
              <td key={i} className="text-right py-2 px-2 font-semibold text-red-600">{fmt(v)}</td>
            ))}
            <td className="text-right py-2 px-3 font-bold text-red-700">{fmt(rowTotal(totalExpenses))}</td>
          </tr>

          {/* Total Ganancias */}
          <tr className="bg-gradient-to-r from-emerald-50 to-blue-50">
            <td className="py-3 px-3 font-bold text-base text-foreground">✦ Total Ganancias</td>
            {ganancias.map((v, i) => (
              <td key={i} className={`text-right py-3 px-2 font-bold text-sm ${v >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                {v !== 0 ? fmt(Math.abs(v)) : "—"}
                {v < 0 && <span className="text-[10px] ml-0.5">(−)</span>}
              </td>
            ))}
            <td className={`text-right py-3 px-3 font-extrabold text-base ${rowTotal(ganancias) >= 0 ? "text-emerald-700" : "text-red-600"}`}>
              {fmt(Math.abs(rowTotal(ganancias)))}
              {rowTotal(ganancias) < 0 && <span className="text-xs ml-1">(pérdida)</span>}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// Export helper so parent can compute summary for AI
export function computePLSummary({ anio, depositos, gastos, gastosProyecto, gastosTarjeta }) {
  const fD = depositos.filter(d => d.anio === anio);
  const fG = gastos.filter(g => g.anio === anio);
  const fP = gastosProyecto.filter(g => g.anio === anio);
  const fT = gastosTarjeta.filter(g => g.anio === anio);

  const sum = (arr, fn) => arr.filter(fn || (() => true)).reduce((s, i) => s + (i.monto || 0), 0);

  const ingresos = sum(fD);
  const labor = sum(fP, g => g.tipo_gasto === "labor" || g.tipo_gasto === "labor_extra");
  const materiales = sum(fP, g => g.tipo_gasto === "material") + sum(fG, g => g.categoria === "materiales");
  const oficina = sum(fG, g => g.categoria === "oficina");
  const seguros = sum(fG, g => g.categoria === "seguros");
  const vehiculos = sum(fG, g => g.categoria === "vehiculos") + sum(fG, g => g.categoria === "gasolina");
  const comida = sum(fG, g => g.categoria === "comida");
  const tarjetas = sum(fT);
  const inversiones = sum(fG, g => g.categoria === "inversiones");
  const servicios = sum(fG, g => g.categoria === "servicios") + sum(fG, g => g.categoria === "otros") + sum(fP, g => g.tipo_gasto === "operativo");
  const totalGastos = labor + materiales + oficina + seguros + vehiculos + comida + tarjetas + inversiones + servicios;
  const ganancia = ingresos - totalGastos;

  return { ingresos, labor, materiales, oficina, seguros, vehiculos, comida, tarjetas, inversiones, servicios, totalGastos, ganancia, anio };
}