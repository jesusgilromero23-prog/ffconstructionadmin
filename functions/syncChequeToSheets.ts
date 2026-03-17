import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const SPREADSHEET_ID = Deno.env.get("AUDIT_SPREADSHEET_ID");
const SHEET_NAME = "Cheques Audit";
const HEADERS = ["ID", "Número", "Beneficiario", "Concepto", "Monto", "Fecha Emisión", "Estado", "Banco", "Mes", "Año", "Notas", "Creado"];

async function ensureSheet(accessToken, spreadsheetId) {
  // Get existing sheets
  const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const meta = await r.json();
  const exists = (meta.sheets || []).some(s => s.properties.title === SHEET_NAME);

  if (!exists) {
    // Create the sheet tab
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ requests: [{ addSheet: { properties: { title: SHEET_NAME } } }] })
    });
    // Write headers
    await appendRows(accessToken, spreadsheetId, [HEADERS]);
  }
}

async function appendRows(accessToken, spreadsheetId, values) {
  const range = encodeURIComponent(`${SHEET_NAME}!A1`);
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ values })
  });
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const payload = await req.json();

  if (!SPREADSHEET_ID) {
    return Response.json({ error: "AUDIT_SPREADSHEET_ID secret not set" }, { status: 500 });
  }

  // Support direct invoke with cheque data, or entity automation payload
  let cheque = payload.data || payload.cheque;
  if (!cheque && payload.event?.entity_id) {
    cheque = await base44.asServiceRole.entities.Cheque.get(payload.event.entity_id);
  }

  if (!cheque) return Response.json({ error: "No cheque data provided" }, { status: 400 });

  const { accessToken } = await base44.asServiceRole.connectors.getConnection("googlesheets");

  await ensureSheet(accessToken, SPREADSHEET_ID);

  const row = [
    cheque.id || "",
    cheque.numero_cheque || "",
    cheque.beneficiario || "",
    cheque.concepto || "",
    cheque.monto || 0,
    cheque.fecha_emision || "",
    cheque.estado || "",
    cheque.banco || "",
    cheque.mes || "",
    cheque.anio || "",
    cheque.notas || "",
    new Date().toISOString(),
  ];

  await appendRows(accessToken, SPREADSHEET_ID, [row]);

  return Response.json({ status: "synced", numero_cheque: cheque.numero_cheque });
});