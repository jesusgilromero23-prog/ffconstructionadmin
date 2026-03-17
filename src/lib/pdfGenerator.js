import { jsPDF } from "jspdf";

const fmt = (v) => `$${(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MESES_C = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function addHeader(doc, title, subtitle) {
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, 220, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("ContaControl", 14, 10);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Sistema de Coordinación Contable", 14, 16);

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 32);
  if (subtitle) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(subtitle, 14, 38);
  }

  doc.setFontSize(8);
  doc.setTextColor(130, 130, 130);
  doc.text(`Generado: ${new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })}`, 14, 44);

  doc.setDrawColor(220, 220, 220);
  doc.line(14, 47, 196, 47);

  return 52;
}

function addFooter(doc) {
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.line(14, 284, 196, 284);
    doc.text("ContaControl — Reporte Confidencial", 14, 289);
    doc.text(`Página ${i} de ${pageCount}`, 196, 289, { align: "right" });
  }
}

function checkPageBreak(doc, y, needed = 12) {
  if (y + needed > 275) {
    doc.addPage();
    return 20;
  }
  return y;
}

function sectionTitle(doc, y, text) {
  y = checkPageBreak(doc, y, 14);
  doc.setFillColor(37, 99, 235);
  doc.rect(14, y, 182, 7, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(text, 17, y + 5);
  return y + 7;
}

function tableRow(doc, y, cols, isAlt, isBold = false) {
  y = checkPageBreak(doc, y);
  if (isAlt) {
    doc.setFillColor(248, 250, 252);
    doc.rect(14, y, 182, 6.5, "F");
  }
  doc.setTextColor(40, 40, 40);
  doc.setFont("helvetica", isBold ? "bold" : "normal");
  doc.setFontSize(7);
  cols.forEach(({ text, x, align }) => {
    doc.text(String(text || "—"), x, y + 4.5, { align: align || "left" });
  });
  return y + 6.5;
}

// ─── REPORTE ANUAL (P&L Completo) ────────────────────────────────────────────
export function generateReporteAnual({ anio, depositos, gastos, gastosProyecto, gastosTarjeta, prestamos }) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = addHeader(doc, `Estado de Resultados ${anio}`, "P&L Detallado — 12 meses");

  const fD = depositos.filter(d => d.anio === anio);
  const fG = gastos.filter(g => g.anio === anio);
  const fP = gastosProyecto.filter(g => g.anio === anio);
  const fT = gastosTarjeta.filter(g => g.anio === anio);

  const sumByMes = (items, mes, filterFn) =>
    items.filter(i => i.mes === mes && (!filterFn || filterFn(i))).reduce((s, i) => s + (i.monto || 0), 0);

  const rows = [
    { label: "INGRESOS (Depósitos)", type: "income", fn: (m) => sumByMes(fD, m) },
    { label: "Labor", type: "expense", fn: (m) => sumByMes(fP, m, g => g.tipo_gasto === "labor" || g.tipo_gasto === "labor_extra") },
    { label: "Gastos Materiales", type: "expense", fn: (m) => sumByMes(fP, m, g => g.tipo_gasto === "material") + sumByMes(fG, m, g => g.categoria === "materiales") },
    { label: "Gastos Oficina", type: "expense", fn: (m) => sumByMes(fG, m, g => g.categoria === "oficina") },
    { label: "Seguros", type: "expense", fn: (m) => sumByMes(fG, m, g => g.categoria === "seguros") },
    { label: "Vehículos / Gasolina", type: "expense", fn: (m) => sumByMes(fG, m, g => g.categoria === "vehiculos") + sumByMes(fG, m, g => g.categoria === "gasolina") },
    { label: "Comida", type: "expense", fn: (m) => sumByMes(fG, m, g => g.categoria === "comida") },
    { label: "Tarjetas de Crédito", type: "expense", fn: (m) => sumByMes(fT, m) },
    { label: "Inversiones", type: "expense", fn: (m) => sumByMes(fG, m, g => g.categoria === "inversiones") },
    { label: "Servicios / Bills / Otros", type: "expense", fn: (m) => sumByMes(fG, m, g => g.categoria === "servicios") + sumByMes(fG, m, g => g.categoria === "otros") + sumByMes(fP, m, g => g.tipo_gasto === "operativo") },
  ];

  const computed = rows.map(r => ({ ...r, values: MESES_C.map((_, i) => r.fn(i + 1)) }));
  const rowTotal = (values) => values.reduce((s, v) => s + v, 0);

  const ingresos = computed[0].values;
  const totalIngresos = rowTotal(ingresos);
  const totalExpMes = MESES_C.map((_, i) => computed.filter(r => r.type === "expense").reduce((s, r) => s + r.values[i], 0));
  const totalEgresos = rowTotal(totalExpMes);
  const ganancias = MESES_C.map((_, i) => ingresos[i] - totalExpMes[i]);
  const totalGanancia = rowTotal(ganancias);

  // KPI Banner
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(14, y, 182, 26, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Ingresos Totales:", 20, y + 9);
  doc.setTextColor(134, 239, 172);
  doc.text(fmt(totalIngresos), 75, y + 9);
  doc.setTextColor(255, 255, 255);
  doc.text("Egresos Totales:", 110, y + 9);
  doc.setTextColor(252, 165, 165);
  doc.text(fmt(totalEgresos), 160, y + 9);
  doc.setTextColor(255, 255, 255);
  doc.text("Resultado Neto:", 20, y + 20);
  doc.setTextColor(totalGanancia >= 0 ? 134 : 252, totalGanancia >= 0 ? 239 : 165, totalGanancia >= 0 ? 172 : 165);
  doc.setFontSize(10);
  doc.text(fmt(totalGanancia), 75, y + 20);
  y += 32;

  // P&L Table Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.text("Estado de Resultados — Desglose por Categoría", 14, y);
  y += 6;

  const labelW = 46;
  const colW = 11.2;
  const startX = 14;

  doc.setFillColor(37, 99, 235);
  doc.rect(startX, y, 182, 7, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6);
  doc.setFont("helvetica", "bold");
  doc.text("Concepto", startX + 2, y + 5);
  MESES_C.forEach((m, i) => {
    doc.text(m, startX + labelW + i * colW + colW - 1, y + 5, { align: "right" });
  });
  doc.text("Total Anual", startX + labelW + 12 * colW + colW - 1, y + 5, { align: "right" });
  y += 7;

  computed.forEach((row, ri) => {
    y = checkPageBreak(doc, y);
    const total = rowTotal(row.values);
    const isIncome = row.type === "income";
    if (isIncome) {
      doc.setFillColor(240, 253, 244);
    } else if (ri % 2 === 0) {
      doc.setFillColor(248, 250, 252);
    } else {
      doc.setFillColor(255, 255, 255);
    }
    doc.rect(startX, y, 182, 6.5, "F");
    doc.setTextColor(isIncome ? 22 : 40, isIncome ? 101 : 40, isIncome ? 52 : 40);
    doc.setFont("helvetica", isIncome ? "bold" : "normal");
    doc.setFontSize(6.5);
    doc.text(row.label, startX + 2, y + 4.5);
    row.values.forEach((v, i) => {
      doc.text(v > 0 ? fmt(v) : "—", startX + labelW + i * colW + colW - 1, y + 4.5, { align: "right" });
    });
    doc.setFont("helvetica", "bold");
    doc.text(total > 0 ? fmt(total) : "—", startX + labelW + 12 * colW + colW - 1, y + 4.5, { align: "right" });
    y += 6.5;
    if (isIncome) { // separator after income row
      doc.setFillColor(220, 220, 220);
      doc.rect(startX, y, 182, 0.5, "F");
      y += 1.5;
    }
  });

  // Total Egresos row
  y = checkPageBreak(doc, y);
  doc.setFillColor(254, 242, 242);
  doc.rect(startX, y, 182, 6.5, "F");
  doc.setTextColor(185, 28, 28);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.text("TOTAL EGRESOS", startX + 2, y + 4.5);
  totalExpMes.forEach((v, i) => {
    doc.text(v > 0 ? fmt(v) : "—", startX + labelW + i * colW + colW - 1, y + 4.5, { align: "right" });
  });
  doc.text(fmt(totalEgresos), startX + labelW + 12 * colW + colW - 1, y + 4.5, { align: "right" });
  y += 6.5;

  // Ganancia row
  y = checkPageBreak(doc, y);
  doc.setFillColor(totalGanancia >= 0 ? 240 : 254, totalGanancia >= 0 ? 253 : 242, totalGanancia >= 0 ? 244 : 242);
  doc.rect(startX, y, 182, 7, "F");
  doc.setTextColor(totalGanancia >= 0 ? 22 : 185, totalGanancia >= 0 ? 163 : 28, totalGanancia >= 0 ? 74 : 28);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("✦ GANANCIA NETA", startX + 2, y + 5);
  ganancias.forEach((v, i) => {
    doc.text(v !== 0 ? fmt(Math.abs(v)) : "—", startX + labelW + i * colW + colW - 1, y + 5, { align: "right" });
  });
  doc.text(fmt(Math.abs(totalGanancia)), startX + labelW + 12 * colW + colW - 1, y + 5, { align: "right" });
  y += 14;

  // ── DETALLE DE TRANSACCIONES ──────────────────────────────────────────────
  doc.addPage();
  y = 20;

  const detailSections = [
    {
      title: "Depósitos / Ingresos",
      items: fD,
      cols: (item) => [
        { text: item.fecha ? new Date(item.fecha + "T12:00:00").toLocaleDateString("es-MX") : "—", x: 17 },
        { text: (item.descripcion || "—").substring(0, 28), x: 45 },
        { text: (item.fuente || "—").substring(0, 20), x: 112 },
        { text: item.tipo ? item.tipo.replace("_", " ") : "—", x: 155 },
        { text: fmt(item.monto), x: 193, align: "right" },
      ],
      headers: [
        { text: "Fecha", x: 17 }, { text: "Descripción", x: 45 },
        { text: "Fuente / Cliente", x: 112 }, { text: "Tipo", x: 155 },
        { text: "Monto", x: 193, align: "right" },
      ],
      color: [22, 163, 74],
    },
    {
      title: "Labor (Nóminas / Cheques de Proyectos)",
      items: fP.filter(g => g.tipo_gasto === "labor" || g.tipo_gasto === "labor_extra"),
      cols: (item) => [
        { text: item.fecha ? new Date(item.fecha + "T12:00:00").toLocaleDateString("es-MX") : "—", x: 17 },
        { text: (item.proyecto || "—").substring(0, 22), x: 45 },
        { text: (item.descripcion || "—").substring(0, 28), x: 90 },
        { text: (item.proveedor || "—").substring(0, 20), x: 152 },
        { text: fmt(item.monto), x: 193, align: "right" },
      ],
      headers: [
        { text: "Fecha", x: 17 }, { text: "Proyecto", x: 45 },
        { text: "Descripción", x: 90 }, { text: "Beneficiario", x: 152 },
        { text: "Monto", x: 193, align: "right" },
      ],
      color: [37, 99, 235],
    },
    {
      title: "Gastos Materiales",
      items: [...fP.filter(g => g.tipo_gasto === "material"), ...fG.filter(g => g.categoria === "materiales")],
      cols: (item) => [
        { text: item.fecha ? new Date(item.fecha + "T12:00:00").toLocaleDateString("es-MX") : "—", x: 17 },
        { text: (item.descripcion || "—").substring(0, 35), x: 45 },
        { text: (item.proveedor || item.proyecto || "—").substring(0, 22), x: 140 },
        { text: fmt(item.monto), x: 193, align: "right" },
      ],
      headers: [
        { text: "Fecha", x: 17 }, { text: "Descripción", x: 45 },
        { text: "Proveedor / Proyecto", x: 140 }, { text: "Monto", x: 193, align: "right" },
      ],
      color: [217, 119, 6],
    },
    {
      title: "Gastos Generales (Oficina, Seguros, Vehículos, Servicios, Otros)",
      items: fG.filter(g => !["materiales", "inversiones"].includes(g.categoria)),
      cols: (item) => [
        { text: item.fecha ? new Date(item.fecha + "T12:00:00").toLocaleDateString("es-MX") : "—", x: 17 },
        { text: (item.categoria || "—"), x: 45 },
        { text: (item.descripcion || "—").substring(0, 30), x: 80 },
        { text: (item.proveedor || "—").substring(0, 20), x: 150 },
        { text: fmt(item.monto), x: 193, align: "right" },
      ],
      headers: [
        { text: "Fecha", x: 17 }, { text: "Categoría", x: 45 },
        { text: "Descripción", x: 80 }, { text: "Proveedor", x: 150 },
        { text: "Monto", x: 193, align: "right" },
      ],
      color: [100, 100, 200],
    },
    {
      title: "Tarjetas de Crédito",
      items: fT,
      cols: (item) => [
        { text: item.fecha ? new Date(item.fecha + "T12:00:00").toLocaleDateString("es-MX") : "—", x: 17 },
        { text: (item.tarjeta || "—").substring(0, 15), x: 45 },
        { text: (item.descripcion || "—").substring(0, 28), x: 85 },
        { text: (item.comercio || "—").substring(0, 20), x: 145 },
        { text: fmt(item.monto), x: 193, align: "right" },
      ],
      headers: [
        { text: "Fecha", x: 17 }, { text: "Tarjeta", x: 45 },
        { text: "Descripción", x: 85 }, { text: "Comercio", x: 145 },
        { text: "Monto", x: 193, align: "right" },
      ],
      color: [220, 38, 38],
    },
    {
      title: "Inversiones",
      items: fG.filter(g => g.categoria === "inversiones"),
      cols: (item) => [
        { text: item.fecha ? new Date(item.fecha + "T12:00:00").toLocaleDateString("es-MX") : "—", x: 17 },
        { text: (item.descripcion || "—").substring(0, 40), x: 45 },
        { text: (item.proveedor || "—").substring(0, 25), x: 155 },
        { text: fmt(item.monto), x: 193, align: "right" },
      ],
      headers: [
        { text: "Fecha", x: 17 }, { text: "Descripción", x: 45 },
        { text: "Proveedor", x: 155 }, { text: "Monto", x: 193, align: "right" },
      ],
      color: [124, 58, 237],
    },
  ];

  detailSections.forEach((section) => {
    if (section.items.length === 0) return;

    y = checkPageBreak(doc, y, 20);
    const [r, g2, b] = section.color;
    doc.setFillColor(r, g2, b);
    doc.rect(14, y, 182, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(section.title, 17, y + 5.5);
    const secTotal = section.items.reduce((s, i) => s + (i.monto || 0), 0);
    doc.text(`Total: ${fmt(secTotal)}`, 193, y + 5.5, { align: "right" });
    y += 8;

    // column headers
    doc.setFillColor(r + 40 > 255 ? 255 : r + 40, g2 + 40 > 255 ? 255 : g2 + 40, b + 40 > 255 ? 255 : b + 40);
    doc.rect(14, y, 182, 5.5, "F");
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.2);
    section.headers.forEach(h => {
      doc.text(h.text, h.x, y + 4, { align: h.align || "left" });
    });
    y += 5.5;

    const sorted = [...section.items].sort((a, b2) => {
      const da = a.fecha || a.fecha_emision || "";
      const db = b2.fecha || b2.fecha_emision || "";
      return da.localeCompare(db);
    });

    sorted.forEach((item, i) => {
      y = checkPageBreak(doc, y);
      if (i % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y, 182, 6.5, "F");
      }
      doc.setTextColor(40, 40, 40);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      section.cols(item).forEach(col => {
        doc.text(String(col.text || "—"), col.x, y + 4.5, { align: col.align || "left" });
      });
      y += 6.5;
    });
    y += 5;
  });

  // Préstamos activos
  if (prestamos && prestamos.length > 0) {
    y = checkPageBreak(doc, y, 20);
    doc.setFillColor(30, 41, 59);
    doc.rect(14, y, 182, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Préstamos y Créditos", 17, y + 5.5);
    y += 8;

    doc.setFillColor(248, 250, 252);
    doc.rect(14, y, 182, 5.5, "F");
    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.2);
    doc.text("Descripción", 17, y + 4);
    doc.text("Entidad", 80, y + 4);
    doc.text("Tipo", 120, y + 4);
    doc.text("Monto", 162, y + 4);
    doc.text("Estado", 183, y + 4);
    y += 5.5;

    prestamos.forEach((p, i) => {
      y = checkPageBreak(doc, y);
      if (i % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(14, y, 182, 6.5, "F"); }
      doc.setTextColor(40, 40, 40);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text((p.descripcion || "—").substring(0, 30), 17, y + 4.5);
      doc.text((p.entidad || "—").substring(0, 20), 80, y + 4.5);
      doc.text((p.tipo || "—").replace("_", " "), 120, y + 4.5);
      doc.text(fmt(p.monto_adquirido), 162, y + 4.5);
      doc.text(p.estado || "—", 183, y + 4.5);
      y += 6.5;
    });
  }

  addFooter(doc);
  doc.save(`Estado_Resultados_${anio}.pdf`);
}

// ─── DASHBOARD PDF (flujo detallado por período) ─────────────────────────────
export function generateDashboardPDF({ periodLabel, fDep, fGas, fChe, fGP, fTar, fPDeu, kpis }) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = addHeader(doc, "Reporte Financiero Detallado", `Período: ${periodLabel}`);

  // KPI Summary
  const totalDepositos = fDep.reduce((s, d) => s + (d.monto || 0), 0);
  const totalEgresos = kpis.totalEgresos;
  const utilidad = kpis.utilidad;

  doc.setFillColor(30, 41, 59);
  doc.roundedRect(14, y, 182, 36, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Resumen del Período", 17, y + 9);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  const kpiItems = [
    { label: "Depósitos / Ingresos", val: kpis.totalDepositos, col: [134, 239, 172] },
    { label: "Labor (Empleados)", val: kpis.totalLabor, col: [252, 165, 165] },
    { label: "Materiales", val: kpis.totalMateriales, col: [252, 165, 165] },
    { label: "Oficina", val: kpis.totalOficina, col: [252, 165, 165] },
    { label: "Seguros", val: kpis.totalSeguros, col: [252, 165, 165] },
    { label: "Tarjetas", val: kpis.totalTarjeta, col: [252, 165, 165] },
    { label: "Vehículos / Gas", val: kpis.totalVehiculos, col: [252, 165, 165] },
    { label: "Servicios / Bills", val: kpis.totalServicios, col: [252, 165, 165] },
    { label: "Comida", val: kpis.totalComida, col: [252, 165, 165] },
    { label: "Inversiones", val: kpis.totalInversiones, col: [252, 211, 77] },
    { label: "Pagos de Deuda", val: kpis.totalPagosDeuda, col: [252, 165, 165] },
  ];

  const half = Math.ceil(kpiItems.length / 2);
  kpiItems.slice(0, half).forEach((k, i) => {
    const ky = y + 17 + i * 7;
    doc.setTextColor(180, 180, 180); doc.text(k.label + ":", 17, ky);
    doc.setTextColor(...k.col); doc.text(fmt(k.val), 80, ky);
  });
  kpiItems.slice(half).forEach((k, i) => {
    const ky = y + 17 + i * 7;
    doc.setTextColor(180, 180, 180); doc.text(k.label + ":", 100, ky);
    doc.setTextColor(...k.col); doc.text(fmt(k.val), 168, ky);
  });

  // Extend box based on items
  const boxH = 17 + half * 7 + 8;
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(14, y, 182, boxH, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Resumen del Período", 17, y + 9);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  kpiItems.slice(0, half).forEach((k, i) => {
    const ky = y + 17 + i * 7;
    doc.setTextColor(180, 180, 180); doc.text(k.label + ":", 17, ky);
    doc.setTextColor(...k.col); doc.text(fmt(k.val), 80, ky);
  });
  kpiItems.slice(half).forEach((k, i) => {
    const ky = y + 17 + i * 7;
    doc.setTextColor(180, 180, 180); doc.text(k.label + ":", 100, ky);
    doc.setTextColor(...k.col); doc.text(fmt(k.val), 168, ky);
  });
  // Net result line at bottom
  doc.setFillColor(utilidad >= 0 ? 22 : 185, utilidad >= 0 ? 101 : 28, utilidad >= 0 ? 52 : 28);
  doc.rect(14, y + boxH - 10, 182, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("RESULTADO NETO:", 17, y + boxH - 3.5);
  doc.text(fmt(utilidad), 193, y + boxH - 3.5, { align: "right" });

  y += boxH + 10;

  // Detail sections
  const sections = [
    {
      title: "Depósitos / Ingresos",
      items: fDep,
      color: [22, 163, 74],
      cols: (item) => [
        { text: item.fecha ? new Date(item.fecha + "T12:00:00").toLocaleDateString("es-MX") : "—", x: 17 },
        { text: (item.descripcion || "—").substring(0, 30), x: 45 },
        { text: (item.fuente || "—").substring(0, 22), x: 118 },
        { text: item.tipo ? item.tipo.replace("_", " ") : "—", x: 155 },
        { text: fmt(item.monto), x: 193, align: "right" },
      ],
      headers: [
        { text: "Fecha", x: 17 }, { text: "Descripción", x: 45 },
        { text: "Fuente / Cliente", x: 118 }, { text: "Tipo", x: 155 },
        { text: "Monto", x: 193, align: "right" },
      ],
    },
    {
      title: "Cheques Emitidos",
      items: fChe,
      color: [37, 99, 235],
      cols: (item) => [
        { text: item.fecha_emision ? new Date(item.fecha_emision + "T12:00:00").toLocaleDateString("es-MX") : "—", x: 17 },
        { text: `#${item.numero_cheque}`, x: 45 },
        { text: (item.beneficiario || "—").substring(0, 22), x: 62 },
        { text: (item.concepto || "—").substring(0, 26), x: 110 },
        { text: item.estado || "—", x: 162 },
        { text: fmt(item.monto), x: 193, align: "right" },
      ],
      headers: [
        { text: "Fecha", x: 17 }, { text: "No.", x: 45 },
        { text: "Beneficiario", x: 62 }, { text: "Concepto", x: 110 },
        { text: "Estado", x: 162 }, { text: "Monto", x: 193, align: "right" },
      ],
    },
    {
      title: "Gastos de Proyectos (Labor, Materiales, Operativos)",
      items: fGP,
      color: [234, 88, 12],
      cols: (item) => [
        { text: item.fecha ? new Date(item.fecha + "T12:00:00").toLocaleDateString("es-MX") : "—", x: 17 },
        { text: (item.proyecto || "—").substring(0, 18), x: 45 },
        { text: (item.tipo_gasto || "—").replace("_", " "), x: 92 },
        { text: (item.descripcion || "—").substring(0, 22), x: 118 },
        { text: (item.proveedor || "—").substring(0, 15), x: 160 },
        { text: fmt(item.monto), x: 193, align: "right" },
      ],
      headers: [
        { text: "Fecha", x: 17 }, { text: "Proyecto", x: 45 },
        { text: "Tipo", x: 92 }, { text: "Descripción", x: 118 },
        { text: "Proveedor", x: 160 }, { text: "Monto", x: 193, align: "right" },
      ],
    },
    {
      title: "Gastos Generales",
      items: fGas,
      color: [100, 116, 139],
      cols: (item) => [
        { text: item.fecha ? new Date(item.fecha + "T12:00:00").toLocaleDateString("es-MX") : "—", x: 17 },
        { text: (item.categoria || "—"), x: 45 },
        { text: (item.descripcion || "—").substring(0, 30), x: 82 },
        { text: (item.proveedor || "—").substring(0, 22), x: 152 },
        { text: fmt(item.monto), x: 193, align: "right" },
      ],
      headers: [
        { text: "Fecha", x: 17 }, { text: "Categoría", x: 45 },
        { text: "Descripción", x: 82 }, { text: "Proveedor", x: 152 },
        { text: "Monto", x: 193, align: "right" },
      ],
    },
    {
      title: "Tarjetas de Crédito",
      items: fTar,
      color: [220, 38, 38],
      cols: (item) => [
        { text: item.fecha ? new Date(item.fecha + "T12:00:00").toLocaleDateString("es-MX") : "—", x: 17 },
        { text: (item.tarjeta || "—").substring(0, 15), x: 45 },
        { text: (item.descripcion || "—").substring(0, 28), x: 85 },
        { text: (item.comercio || "—").substring(0, 22), x: 148 },
        { text: fmt(item.monto), x: 193, align: "right" },
      ],
      headers: [
        { text: "Fecha", x: 17 }, { text: "Tarjeta", x: 45 },
        { text: "Descripción", x: 85 }, { text: "Comercio", x: 148 },
        { text: "Monto", x: 193, align: "right" },
      ],
    },
    {
      title: "Pagos de Deuda / Préstamos",
      items: fPDeu,
      color: [124, 58, 237],
      cols: (item) => [
        { text: item.fecha ? new Date(item.fecha + "T12:00:00").toLocaleDateString("es-MX") : "—", x: 17 },
        { text: (item.descripcion || "—").substring(0, 30), x: 45 },
        { text: (item.prestamo_descripcion || "—").substring(0, 28), x: 112 },
        { text: fmt(item.monto), x: 193, align: "right" },
      ],
      headers: [
        { text: "Fecha", x: 17 }, { text: "Descripción", x: 45 },
        { text: "Préstamo", x: 112 }, { text: "Monto", x: 193, align: "right" },
      ],
    },
  ];

  sections.forEach((section) => {
    if (section.items.length === 0) return;
    y = checkPageBreak(doc, y, 22);
    const [r, g2, b] = section.color;
    doc.setFillColor(r, g2, b);
    doc.rect(14, y, 182, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(section.title, 17, y + 5.5);
    const secTotal = section.items.reduce((s, i) => s + (i.monto || 0), 0);
    doc.text(`Total: ${fmt(secTotal)}  (${section.items.length} registros)`, 193, y + 5.5, { align: "right" });
    y += 8;

    const lightR = Math.min(r + 180, 255), lightG = Math.min(g2 + 180, 255), lightB = Math.min(b + 180, 255);
    doc.setFillColor(lightR, lightG, lightB);
    doc.rect(14, y, 182, 5.5, "F");
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.2);
    section.headers.forEach(h => {
      doc.text(h.text, h.x, y + 4, { align: h.align || "left" });
    });
    y += 5.5;

    const sorted = [...section.items].sort((a, b2) => {
      const da = a.fecha || a.fecha_emision || "";
      const db2 = b2.fecha || b2.fecha_emision || "";
      return da.localeCompare(db2);
    });

    sorted.forEach((item, i) => {
      y = checkPageBreak(doc, y);
      if (i % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y, 182, 6.5, "F");
      }
      doc.setTextColor(40, 40, 40);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      section.cols(item).forEach(col => {
        doc.text(String(col.text || "—"), col.x, y + 4.5, { align: col.align || "left" });
      });
      y += 6.5;
    });
    y += 5;
  });

  addFooter(doc);
  const safePeriod = periodLabel.replace(/\s+/g, "_").replace(/[^\w_]/g, "");
  doc.save(`Reporte_Financiero_${safePeriod}.pdf`);
}

// ─── ESTADO DE PROYECTO ─────────────────────────────────────────────────────
export function generateProyectoPDF({ proyecto, contratos, gastos }) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = addHeader(doc, `Estado de Proyecto`, proyecto.nombre);

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 182, 20, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);
  doc.text(`Cliente: ${proyecto.cliente || "—"}`, 20, y + 7);
  doc.text(`Estado: ${(proyecto.estado || "—").replace("_", " ")}`, 100, y + 7);
  doc.text(`Inicio: ${proyecto.fecha_inicio ? new Date(proyecto.fecha_inicio).toLocaleDateString("es-MX") : "—"}`, 20, y + 15);
  if (proyecto.fecha_fin) doc.text(`Fin Est.: ${new Date(proyecto.fecha_fin).toLocaleDateString("es-MX")}`, 100, y + 15);
  y += 26;

  const totalContrato = contratos.reduce((s, c) => s + (c.monto_contrato || 0), 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.text("Contratos del Proyecto (Ingresos +)", 14, y);
  y += 6;

  doc.setFillColor(22, 163, 74);
  doc.rect(14, y, 182, 7, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.text("Tipo", 17, y + 5);
  doc.text("Descripción", 45, y + 5);
  doc.text("General Contractor", 100, y + 5);
  doc.text("Estado", 148, y + 5);
  doc.text("Monto Contrato", 185, y + 5, { align: "right" });
  y += 7;

  contratos.forEach((c, i) => {
    if (i % 2 === 0) { doc.setFillColor(240, 253, 244); doc.rect(14, y, 182, 6.5, "F"); }
    doc.setTextColor(40, 40, 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(c.tipo_contrato || "—", 17, y + 4.5);
    doc.text((c.descripcion || "—").substring(0, 30), 45, y + 4.5);
    doc.text((c.general_contractor || "—").substring(0, 24), 100, y + 4.5);
    doc.text(c.estado || "—", 148, y + 4.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(22, 163, 74);
    doc.text(fmt(c.monto_contrato), 185, y + 4.5, { align: "right" });
    y += 6.5;
  });

  doc.setFillColor(240, 253, 244);
  doc.rect(14, y, 182, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(22, 163, 74);
  doc.text("TOTAL CONTRATOS", 17, y + 5);
  doc.text(fmt(totalContrato), 185, y + 5, { align: "right" });
  y += 13;

  const totalLabor = gastos.filter(g => g.tipo_gasto === "labor" || g.tipo_gasto === "labor_extra").reduce((s, g) => s + (g.monto || 0), 0);
  const totalMat = gastos.filter(g => g.tipo_gasto === "material").reduce((s, g) => s + (g.monto || 0), 0);
  const totalOp = gastos.filter(g => g.tipo_gasto === "operativo").reduce((s, g) => s + (g.monto || 0), 0);
  const totalGastos = totalLabor + totalMat + totalOp;
  const ganancia = totalContrato - totalGastos;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.text("Gastos del Proyecto (Egresos −)", 14, y);
  y += 6;

  doc.setFillColor(220, 38, 38);
  doc.rect(14, y, 182, 7, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.text("Fecha", 17, y + 5);
  doc.text("Tipo", 45, y + 5);
  doc.text("Descripción", 72, y + 5);
  doc.text("Proveedor", 130, y + 5);
  doc.text("Monto", 185, y + 5, { align: "right" });
  y += 7;

  gastos.forEach((g, i) => {
    if (y > 265) { doc.addPage(); y = 20; }
    if (i % 2 === 0) { doc.setFillColor(254, 242, 242); doc.rect(14, y, 182, 6.5, "F"); }
    doc.setTextColor(40, 40, 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(g.fecha ? new Date(g.fecha).toLocaleDateString("es-MX") : "—", 17, y + 4.5);
    doc.text((g.tipo_gasto || "—").replace("_", " "), 45, y + 4.5);
    doc.text((g.descripcion || "—").substring(0, 32), 72, y + 4.5);
    doc.text((g.proveedor || "—").substring(0, 18), 130, y + 4.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(220, 38, 38);
    doc.text(fmt(g.monto), 185, y + 4.5, { align: "right" });
    y += 6.5;
  });

  y += 4;
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(14, y, 182, 38, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Estado de Resultados del Proyecto", 17, y + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Labor:`, 17, y + 17); doc.text(fmt(totalLabor), 100, y + 17);
  doc.text(`Materiales:`, 17, y + 24); doc.text(fmt(totalMat), 100, y + 24);
  doc.text(`Operativos:`, 17, y + 31); doc.text(fmt(totalOp), 100, y + 31);
  doc.text(`Total Gastos:`, 110, y + 17); doc.setTextColor(255, 150, 150); doc.text(fmt(totalGastos), 180, y + 17, { align: "right" });
  doc.setTextColor(255, 255, 255);
  doc.text(`Total Contratos:`, 110, y + 24); doc.setTextColor(150, 255, 180); doc.text(fmt(totalContrato), 180, y + 24, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(ganancia >= 0 ? 150 : 255, ganancia >= 0 ? 255 : 100, ganancia >= 0 ? 180 : 100);
  doc.text(`GANANCIA NETA:`, 110, y + 33);
  doc.text(fmt(ganancia), 180, y + 33, { align: "right" });

  addFooter(doc);
  doc.save(`Proyecto_${proyecto.nombre.replace(/\s+/g, "_")}.pdf`);
}

// ─── RECIBO DE CHEQUE ────────────────────────────────────────────────────────
export function generateReciboCheque(cheque) {
  const doc = new jsPDF({ unit: "mm", format: [148, 105], orientation: "landscape" });

  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, 148, 18, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("ContaControl", 10, 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("Recibo de Cheque", 10, 14);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`#${cheque.numero_cheque}`, 138, 11, { align: "right" });

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(9);
  let y = 26;

  doc.setFont("helvetica", "bold");
  doc.text("BENEFICIARIO:", 10, y);
  doc.setFont("helvetica", "normal");
  doc.text(cheque.beneficiario || "—", 50, y);

  doc.setFont("helvetica", "bold");
  doc.text("FECHA DE EMISIÓN:", 95, y);
  doc.setFont("helvetica", "normal");
  doc.text(cheque.fecha_emision ? new Date(cheque.fecha_emision).toLocaleDateString("es-MX") : "—", 138, y, { align: "right" });

  y += 9;
  doc.setFont("helvetica", "bold");
  doc.text("CONCEPTO:", 10, y);
  doc.setFont("helvetica", "normal");
  doc.text((cheque.concepto || "—").substring(0, 50), 50, y);

  doc.setFont("helvetica", "bold");
  doc.text("BANCO:", 95, y);
  doc.setFont("helvetica", "normal");
  doc.text(cheque.banco || "—", 138, y, { align: "right" });

  y += 9;
  doc.setFont("helvetica", "bold");
  doc.text("ESTADO:", 10, y);
  doc.setFont("helvetica", "normal");
  doc.text((cheque.estado || "—").toUpperCase(), 50, y);

  if (cheque.notas) {
    y += 9;
    doc.setFont("helvetica", "bold");
    doc.text("NOTAS:", 10, y);
    doc.setFont("helvetica", "normal");
    doc.text(cheque.notas.substring(0, 80), 50, y);
  }

  doc.setFillColor(37, 99, 235);
  doc.roundedRect(95, 50, 43, 22, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("MONTO", 116, 57, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(fmt(cheque.monto), 116, 67, { align: "center" });

  doc.setDrawColor(200, 200, 200);
  doc.line(10, 92, 138, 92);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(150, 150, 150);
  doc.text("ContaControl — Documento generado electrónicamente", 10, 97);
  doc.text(`${new Date().toLocaleString("es-MX")}`, 138, 97, { align: "right" });

  doc.save(`Cheque_${cheque.numero_cheque}_${cheque.beneficiario?.replace(/\s+/g, "_")}.pdf`);
}

// ─── LISTADO DE CHEQUES ──────────────────────────────────────────────────────
export function generateListadoCheques({ cheques, desde, hasta }) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const subtitle = desde && hasta ? `Del ${desde} al ${hasta}` : "Todos";
  let y = addHeader(doc, `Control de Cheques`, subtitle);

  const total = cheques.reduce((s, c) => s + (c.monto || 0), 0);

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 182, 12, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);
  doc.text(`Total cheques: ${cheques.length}`, 20, y + 8);
  doc.text(`Monto total: ${fmt(total)}`, 80, y + 8);
  doc.text(`Próx. consecutivo: #${cheques.length > 0 ? Math.max(...cheques.map(c => c.numero_cheque || 0)) + 1 : 1}`, 145, y + 8);
  y += 18;

  doc.setFillColor(37, 99, 235);
  doc.rect(14, y, 182, 7, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.text("No.", 17, y + 5);
  doc.text("Fecha", 30, y + 5);
  doc.text("Beneficiario", 58, y + 5);
  doc.text("Concepto", 100, y + 5);
  doc.text("Banco", 140, y + 5);
  doc.text("Estado", 162, y + 5);
  doc.text("Monto", 185, y + 5, { align: "right" });
  y += 7;

  cheques.forEach((c, i) => {
    if (y > 270) { doc.addPage(); y = 20; }
    if (i % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(14, y, 182, 6.5, "F"); }
    doc.setTextColor(40, 40, 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(`#${c.numero_cheque}`, 17, y + 4.5);
    doc.text(c.fecha_emision ? new Date(c.fecha_emision).toLocaleDateString("es-MX") : "—", 30, y + 4.5);
    doc.text((c.beneficiario || "—").substring(0, 20), 58, y + 4.5);
    doc.text((c.concepto || "—").substring(0, 20), 100, y + 4.5);
    doc.text((c.banco || "—").substring(0, 12), 140, y + 4.5);
    doc.text(c.estado || "—", 162, y + 4.5);
    doc.setFont("helvetica", "bold");
    doc.text(fmt(c.monto), 185, y + 4.5, { align: "right" });
    y += 6.5;
  });

  doc.setFillColor(37, 99, 235);
  doc.rect(14, y, 182, 7, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("TOTAL", 162, y + 5);
  doc.text(fmt(total), 185, y + 5, { align: "right" });

  addFooter(doc);
  doc.save(`Cheques_${subtitle.replace(/\s+/g, "_")}.pdf`);
}