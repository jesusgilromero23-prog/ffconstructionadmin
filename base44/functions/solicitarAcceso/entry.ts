import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { usuario_email, usuario_nombre, motivo } = await req.json();

    if (!usuario_email) {
      return Response.json({ error: 'Email requerido' }, { status: 400 });
    }

    const adminEmail = Deno.env.get("ADMIN_EMAIL");
    if (!adminEmail) {
      return Response.json({ error: 'ADMIN_EMAIL no configurado' }, { status: 500 });
    }

    // Save request to DB
    await base44.asServiceRole.entities.SolicitudAcceso.create({
      usuario_email,
      usuario_nombre: usuario_nombre || usuario_email,
      motivo: motivo || "Sin motivo especificado",
      estado: "pendiente",
    });

    // Send email notification to admin
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: adminEmail,
      from_name: "ContaControl",
      subject: `🔑 Solicitud de acceso de edición — ${usuario_nombre || usuario_email}`,
      body: `
<h2>Nueva solicitud de acceso de edición</h2>
<p>Un usuario ha solicitado permisos para realizar cambios en ContaControl.</p>
<table style="border-collapse:collapse;width:100%;max-width:500px">
  <tr><td style="padding:8px;font-weight:bold;border:1px solid #ddd">Nombre:</td><td style="padding:8px;border:1px solid #ddd">${usuario_nombre || "—"}</td></tr>
  <tr><td style="padding:8px;font-weight:bold;border:1px solid #ddd">Correo:</td><td style="padding:8px;border:1px solid #ddd">${usuario_email}</td></tr>
  <tr><td style="padding:8px;font-weight:bold;border:1px solid #ddd">Motivo:</td><td style="padding:8px;border:1px solid #ddd">${motivo || "Sin motivo especificado"}</td></tr>
</table>
<p style="margin-top:20px">Ingresa al <strong>Panel de Administración</strong> de ContaControl para aprobar o rechazar esta solicitud.</p>
      `,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});