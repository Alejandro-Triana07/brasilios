import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host:   process.env.MAIL_HOST || 'smtp.gmail.com',
  port:   Number(process.env.MAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export async function enviarCodigoRecuperacion(
  correo: string,
  nombre: string,
  codigo: string
): Promise<void> {
  await transporter.sendMail({
    from:    `"Sistema Auth" <${process.env.MAIL_USER}>`,
    to:      correo,
    subject: 'Código de recuperación de contraseña',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto">
        <h2>Recuperación de contraseña</h2>
        <p>Hola <strong>${nombre}</strong>,</p>
        <p>Tu código de verificación es:</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:8px;
                    text-align:center;padding:20px;background:#f4f4f4;
                    border-radius:8px;margin:20px 0">
          ${codigo}
        </div>
        <p>Este código expira en <strong>${process.env.RESET_CODE_EXPIRES_MINUTES || 15} minutos</strong>.</p>
        <p>Si no solicitaste este cambio, ignora este correo.</p>
      </div>
    `,
  });
}
