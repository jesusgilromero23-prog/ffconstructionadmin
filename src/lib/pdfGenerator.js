import { jsPDF } from "jspdf";

const fmt = (v) => `$${(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MESES_C = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function addHeader(doc, title, subtitle) {
  // Background bar
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, 220, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("ContaControl", 14, 10);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Sistema de Coordinación Contable", 14, 16);

  // Title section
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

  // Date
  doc.setFontSize(8);
  doc.setTextColor(130, 130, 130);
  doc.text(`Generado: ${new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })}`, 14, 44);

  // Divider
  doc.setDrawColor(220, 220, 220);
  doc.line(14, 47, 196, 47);

  return 52; // return y cursor
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

// ─── REPORTE ANUAL ──────────────────────────────────────────────────────────
export function generateReporteAnual({ anio, annualData, grandTotal, depositos, prestamos }) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = addHeader(doc, `Reporte Anual ${anio}`, "Estado de resultados — 12 meses");

  const rows = [
    { label: "Gastos Generales", key: "gastos" },
    { label: "Cheques Emitidos", key: "cheques" },
    { label: "Gastos Proyectos", key: "proyectos" },
    { label: "Tarjetas Crédito", key: "tarjetas" },
  ];

  // Summary KPIs
  const totalDepositos = depositos.reduce((s, d) => s + (d.monto || 0), 0);
  const utilidad = totalDepositos - grandTotal;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 182, 24, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  doc.text("Ingresos Totales:", 20, y + 8);
  doc.setTextColor(22, 163, 74);
  doc.text(fmt(totalDepositos), 70, y + 8);
  doc.setTextColor(30, 30, 30);
  doc.text("Egresos Totales:", 100, y + 8);
  doc.setTextColor(220, 38, 38);
  doc.text(fmt(grandTotal), 150, y + 8);
  doc.setTextColor(30, 30, 30);
  doc.text("Resultado Neto:", 20, y + 18);
  doc.setTextColor(utilidad >= 0 ? 22 : 220, utilidad >= 0 ? 163 : 38, utilidad >= 0 ? 74 : 38);
  doc.text(fmt(utilidad), 70, y + 18);
  y += 30;

  // Annual table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.text("Desglose por Categoría — 12 Meses", 14, y);
  y += 6;

  // Table header
  const colW = 13;
  const startX = 14;
  const labelW = 34;

  doc.setFillColor(37, 99, 235);
  doc.rect(startX, y, 182, 7, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6.5);
  doc.text("Categoría", startX + 2, y + 5);
  MESES_C.forEach((m, i) => {
    doc.text(m, startX + labelW + i * colW + 1, y + 5);
  });
  doc.text("Total", startX + labelW + 12 * colW + 1, y + 5);
  y += 7;

  rows.forEach((row, ri) => {
    if (ri % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(startX, y, 182, 6.5, "F");
    }
    doc.setTextColor(40, 40, 40);
    doc.setFont("helvetica", ri === rows.length - 1 ? "bold" : "normal");
    doc.setFontSize(6.5);
    doc.text(row.label, startX + 2, y + 4.5);
    annualData.forEach((d, i) => {
      const val = d[row.key];
      doc.text(val > 0 ? fmt(val) : "—", startX + labelW + i * colW + colW - 1, y + 4.5, { align: "right" });
    });
    const rowTotal = annualData.reduce((s, d) => s + (d[row.key] || 0), 0);
    doc.setFont("helvetica", "bold");
    doc.text(fmt(rowTotal), startX + labelW + 12 * colW + colW - 1, y + 4.5, { align: "right" });
    y += 6.5;
  });

  // Total row
  doc.setFillColor(37, 99, 235);
  doc.rect(startX, y, 182, 7, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.text("TOTAL EGRESOS", startX + 2, y + 5);
  annualData.forEach((d, i) => {
    doc.text(d.total > 0 ? fmt(d.total) : "—", startX + labelW + i * colW + colW - 1, y + 5, { align: "right" });
  });
  doc.text(fmt(grandTotal), startX + labelW + 12 * colW + colW - 1, y + 5, { align: "right" });
  y += 14;

  // Prestamos section
  if (prestamos.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.text("Préstamos y Créditos Activos", 14, y);
    y += 7;

    doc.setFillColor(37, 99, 235);
    doc.rect(14, y, 182, 7, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.text("Descripción", 17, y + 5);
    doc.text("Entidad", 80, y + 5);
    doc.text("Tipo", 120, y + 5);
    doc.text("Monto", 160, y + 5);
    doc.text("Estado", 178, y + 5);
    y += 7;

    prestamos.forEach((p, i) => {
      if (i % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(14, y, 182, 6.5, "F"); }
      doc.setTextColor(40, 40, 40);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text(p.descripcion || "—", 17, y + 4.5);
      doc.text(p.entidad || "—", 80, y + 4.5);
      doc.text((p.tipo || "—").replace("_", " "), 120, y + 4.5);
      doc.text(fmt(p.monto_adquirido), 160, y + 4.5);
      doc.text(p.estado || "—", 178, y + 4.5);
      y += 6.5;
    });
  }

  addFooter(doc);
  doc.save(`Reporte_Anual_${anio}.pdf`);
}

// ─── ESTADO DE PROYECTO ─────────────────────────────────────────────────────
export function generateProyectoPDF({ proyecto, contratos, gastos }) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = addHeader(doc, `Estado de Proyecto`, proyecto.nombre);

  // Project info
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

  // Contracts
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

  // Gastos
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
  // P&L Summary
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

  // Body
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

  // Amount box
  doc.setFillColor(37, 99, 235);
  doc.roundedRect(95, 50, 43, 22, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("MONTO", 116, 57, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(fmt(cheque.monto), 116, 67, { align: "center" });

  // Footer line
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
export function generateListadoCheques({ cheques, mes, anio }) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const mesNombre = mes > 0 ? MESES[mes - 1] : "Todos los meses";
  let y = addHeader(doc, `Control de Cheques`, `${mesNombre} ${anio}`);

  const total = cheques.reduce((s, c) => s + (c.monto || 0), 0);

  // Summary
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 182, 12, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);
  doc.text(`Total cheques: ${cheques.length}`, 20, y + 8);
  doc.text(`Monto total: ${fmt(total)}`, 80, y + 8);
  doc.text(`Próx. consecutivo: #${cheques.length > 0 ? Math.max(...cheques.map(c => c.numero_cheque || 0)) + 1 : 1}`, 145, y + 8);
  y += 18;

  // Table header
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

  // Total
  doc.setFillColor(37, 99, 235);
  doc.rect(14, y, 182, 7, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("TOTAL", 162, y + 5);
  doc.text(fmt(total), 185, y + 5, { align: "right" });

  addFooter(doc);
  doc.save(`Cheques_${mesNombre}_${anio}.pdf`);
}