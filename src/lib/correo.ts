import { Resend } from "resend";

/**
 * Envío de correos con Resend.
 *
 * Sin RESEND_API_KEY no se manda nada y se deja el enlace en el log:
 * así el registro y el login siguen funcionando en desarrollo sin
 * obligar a configurar el correo.
 */
const clave = process.env.RESEND_API_KEY;
const resend = clave ? new Resend(clave) : null;

/** Dominio verificado en Resend; el de pruebas si no hay uno propio. */
const REMITENTE =
  process.env.CORREO_REMITENTE ?? "MecanicoApp <onboarding@resend.dev>";

export async function enviarRecuperacion({
  para,
  nombre,
  url,
}: {
  para: string;
  nombre: string;
  url: string;
}) {
  if (!resend) {
    console.warn(
      `[correo] Sin RESEND_API_KEY. Enlace para ${para}:\n${url}`
    );
    return;
  }

  const { error } = await resend.emails.send({
    from: REMITENTE,
    to: para,
    subject: "Recuperar tu contraseña — MecanicoApp",
    // Texto plano además del HTML: algunos clientes de correo lo
    // prefieren, y ayuda a no caer en spam.
    text: `Hola ${nombre},

Para cambiar tu contraseña de MecanicoApp entra acá:
${url}

El enlace sirve por una hora. Si no pediste esto, ignora el correo:
tu contraseña sigue siendo la misma.`,
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
        <p style="font-size: 18px; font-weight: 600; margin: 0 0 24px;">
          Mecanico<span style="color: #c2410c;">App</span>
        </p>
        <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
          Hola ${nombre},
        </p>
        <p style="font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
          Para cambiar tu contraseña, toca el botón:
        </p>
        <a href="${url}"
           style="display: inline-block; background: #c2410c; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 500;">
          Cambiar mi contraseña
        </a>
        <p style="font-size: 14px; line-height: 1.6; color: #666; margin: 24px 0 0;">
          El enlace sirve por una hora. Si no pediste esto, ignora el
          correo: tu contraseña sigue siendo la misma.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("[correo] No se pudo enviar la recuperación:", error);
    throw new Error("No se pudo enviar el correo.");
  }
}
