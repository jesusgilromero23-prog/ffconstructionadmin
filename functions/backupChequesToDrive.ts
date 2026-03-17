import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all cheque records
    const cheques = await base44.asServiceRole.entities.Cheque.list('-fecha_emision', 2000);

    // Build CSV content
    const headers = ['numero_cheque','beneficiario','monto','fecha_emision','concepto','estado','banco','mes','anio','notas'];
    const rows = cheques.map(c =>
      headers.map(h => {
        const val = c[h] ?? '';
        const str = String(val).replace(/"/g, '""');
        return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str;
      }).join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');

    // Get Drive access token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');

    const today = new Date().toISOString().split('T')[0];
    const fileName = `cheques_backup_${today}.csv`;

    // Create or find the backup folder
    const folderMeta = JSON.stringify({
      name: 'Cheques Backups',
      mimeType: 'application/vnd.google-apps.folder',
    });

    // Search for existing folder (only app-created files are accessible with drive.file scope)
    // We'll just upload to root and rely on the folder being app-created
    // Upload the CSV file using multipart
    const boundary = 'backup_boundary_123';
    const fileMeta = JSON.stringify({ name: fileName, mimeType: 'text/csv' });

    const multipartBody =
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${fileMeta}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: text/csv\r\n\r\n` +
      `${csv}\r\n` +
      `--${boundary}--`;

    const uploadRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartBody,
      }
    );

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      return Response.json({ error: 'Drive upload failed', details: err }, { status: 500 });
    }

    const file = await uploadRes.json();
    return Response.json({
      success: true,
      file_id: file.id,
      file_name: fileName,
      cheques_backed_up: cheques.length,
      date: today,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});