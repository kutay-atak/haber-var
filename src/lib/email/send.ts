import "server-only";
import nodemailer from "nodemailer";
import { serverEnv } from "@/lib/server-env";

let transport: ReturnType<typeof nodemailer.createTransport> | null = null;

export function isEmailConfigured() {
  return Boolean(serverEnv.gmailUser && serverEnv.gmailAppPassword);
}

/**
 * Varsayılan olarak Gmail SMTP kullanır. SMTP_HOST / SMTP_PORT verilirse başka bir
 * ücretsiz SMTP servisi de (ör. Brevo) aynı kullanıcı adı/şifre değişkenleriyle çalışır.
 */
function getTransport(user: string, pass: string) {
  if (!transport) {
    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = Number(process.env.SMTP_PORT || 465);
    transport = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
  }
  return transport;
}

/** E-posta gönderir. Ayarlanmamışsa göndermeden false döner. */
export async function sendEmail(message: { to: string; subject: string; html: string; text: string }): Promise<boolean> {
  const user = serverEnv.gmailUser;
  const pass = serverEnv.gmailAppPassword;
  if (!user || !pass) {
    console.warn(`[e-posta] GMAIL_USER / GMAIL_APP_PASSWORD tanımlı değil, gönderilmedi: ${message.subject}`);
    return false;
  }
  try {
    await getTransport(user, pass).sendMail({
      from: { name: "Haber Var", address: process.env.EMAIL_FROM || user },
      ...message,
    });
    return true;
  } catch (error) {
    console.error("[e-posta] gönderilemedi", message.to, error);
    return false;
  }
}
