import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const [user, connection] = await Promise.all([
    base44.auth.me(),
    base44.asServiceRole.connectors.getConnection('googlesheets'),
  ]);

  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { spreadsheetId, sheetName = 'Sheet1' } = await req.json();
  if (!spreadsheetId) return Response.json({ error: 'spreadsheetId requerido' }, { status: 400 });

  const { accessToken } = connection;
  const range = encodeURIComponent(`${sheetName}!A1:Z1000`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });

  if (!res.ok) {
    const err = await res.text();
    return Response.json({ error: `Error leyendo Sheets: ${err}` }, { status: 400 });
  }

  const data = await res.json();
  const rows = data.values || [];
  if (rows.length < 2) return Response.json({ imported: 0, skipped: 0, errors: [] });

  const headers = rows[0].map(h => h.toString().toLowerCase().trim());
  const results = { imported: 0, skipped: 0, errors: [] };

  const cheques = rows.slice(1).map((row, i) => {
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = row[idx] || ''; });

    const numero = parseInt(obj['numero_cheque'] || obj['numero'] || obj['#cheque']);
    const beneficiario = obj['beneficiario'] || obj['nombre'] || obj['empleado'];
    const montoRaw = parseFloat((obj['monto'] || obj['amount'] || '0').toString().replace(/[$,]/g, ''));
    const fecha = obj['fecha_emision'] || obj['fecha'] || obj['date'];

    if (!numero || !beneficiario || !montoRaw || !fecha) {
      results.errors.push(`Fila ${i + 2}: datos incompletos`);
      results.skipped++;
      return null;
    }

    const fechaObj = new Date(fecha);
    return {
      numero_cheque: numero,
      beneficiario,
      monto: montoRaw,
      fecha_emision: fechaObj.toISOString().split('T')[0],
      concepto: obj['concepto'] || obj['descripcion'] || obj['concept'] || '',
      estado: obj['estado'] || obj['status'] || 'emitido',
      banco: obj['banco'] || obj['bank'] || '',
      mes: fechaObj.getMonth() + 1,
      anio: fechaObj.getFullYear(),
      notas: obj['notas'] || obj['notes'] || '',
    };
  }).filter(Boolean);

  if (cheques.length > 0) {
    await base44.asServiceRole.entities.Cheque.bulkCreate(cheques);
    results.imported = cheques.length;
  }

  return Response.json(results);
});