import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const [cheques, connection] = await Promise.all([
    base44.asServiceRole.entities.Cheque.list('-fecha_emision', 2000),
    base44.asServiceRole.connectors.getConnection('googledrive'),
  ]);

  const { accessToken } = connection;

  // Build CSV content
  const headers = ['numero_cheque','beneficiario','monto','fecha_emision','concepto','estado','banco','mes','anio','notas'];
  const csvRows = [headers.join(',')];
  for (const c of cheques) {
    csvRows.push(headers.map(h => {
      const val = c[h] ?? '';
      const str = String(val).replace(/"/g, '""');
      return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
    }).join(','));
  }
  const csvContent = csvRows.join('\n');

  const today = new Date().toISOString().split('T')[0];
  const fileName = `cheques_backup_${today}.csv`;

  // Upload as multipart to Google Drive
  const metadata = JSON.stringify({ name: fileName, mimeType: 'text/csv' });
  const boundary = 'backup_boundary_xyz';
  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    metadata,
    `--${boundary}`,
    'Content-Type: text/csv',
    '',
    csvContent,
    `--${boundary}--`,
  ].join('\r\n');

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    return Response.json({ error: `Drive upload failed: ${err}` }, { status: 500 });
  }

  const file = await uploadRes.json();
  return Response.json({ success: true, fileId: file.id, fileName, records: cheques.length });
});