import "server-only";
import { translator, type Locale } from "@/lib/i18n";

// E-posta istemcileri modern CSS'i desteklemez; bu yüzden tablo tabanlı,
// satır içi stilli, sade bir şablon kullanıyoruz.

const C = {
  cream: "#fff8f0",
  paper: "#fffdf9",
  ink: "#3d405b",
  soft: "#64677f",
  line: "#ecdccb",
  button: "#b4523a",
  mustard: "#fcf0d9",
};

function escape(text: string) {
  return text.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);
}

interface EmailContent {
  preheader: string;
  heading: string;
  paragraphs: string[];
  list?: string[];
  cta: { label: string; url: string };
  footer: string;
}

export function renderEmail(content: EmailContent, locale: Locale = "tr"): { html: string; text: string } {
  const paragraphs = content.paragraphs
    .map((p) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${C.ink};">${escape(p)}</p>`)
    .join("");
  const list = content.list?.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 22px;background:${C.mustard};border-radius:14px;">
        <tr><td style="padding:16px 20px;">
          ${content.list
            .map(
              (item, i) =>
                `<p style="margin:${i ? "10px" : "0"} 0 0;font-size:15px;line-height:1.5;color:${C.ink};"><strong style="color:${C.button};">${i + 1}.</strong> ${escape(item)}</p>`,
            )
            .join("")}
        </td></tr>
      </table>`
    : "";

  const html = `<!doctype html>
<html lang="${locale}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(content.heading)}</title></head>
<body style="margin:0;padding:0;background:${C.cream};">
  <span style="display:none!important;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${escape(content.preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream};">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr><td style="padding:0 8px 18px;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:bold;color:${C.ink};">
          📰 Haber <span style="color:${C.button};">Var</span>
        </td></tr>
        <tr><td style="background:${C.paper};border:1px solid ${C.line};border-radius:24px;padding:32px 28px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
          <h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;color:${C.ink};">${escape(content.heading)}</h1>
          ${paragraphs}
          ${list}
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;">
            <tr><td style="border-radius:999px;background:${C.button};">
              <a href="${escape(content.cta.url)}" style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:999px;">${escape(content.cta.label)}</a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:18px 12px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;line-height:1.5;color:${C.soft};text-align:center;">
          ${escape(content.footer)}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    content.heading,
    "",
    content.paragraphs.join("\n\n"),
    ...(content.list?.length ? ["", ...content.list.map((item, i) => `${i + 1}. ${item}`)] : []),
    "",
    `${content.cta.label}: ${content.cta.url}`,
    "",
    "—",
    content.footer,
  ].join("\n");

  return { html, text };
}

interface IssueEmailContext {
  name: string;
  groupName: string;
  issueLabel: string;
  issueUrl: string;
  profileUrl: string;
  locale: Locale;
}

const footer = (ctx: IssueEmailContext) =>
  translator(ctx.locale)(
    `Bu e-postayı "${ctx.groupName}" grubunun üyesi olduğun için aldın. Bildirim ayarlarını buradan değiştirebilirsin: ${ctx.profileUrl}`,
    `You're getting this email because you're a member of "${ctx.groupName}". You can change your notification settings here: ${ctx.profileUrl}`,
  );

export function issueOpenEmail(ctx: IssueEmailContext & { deadline: string; questions: string[] }) {
  const t = translator(ctx.locale);
  return {
    subject: t(`📰 ${ctx.groupName}: ${ctx.issueLabel} başladı!`, `📰 ${ctx.groupName}: ${ctx.issueLabel} has started!`),
    ...renderEmail(
      {
        preheader: t(
          `Son gün ${ctx.deadline}. Bu sayının soruları seni bekliyor.`,
          `The deadline is ${ctx.deadline}. This issue's questions are waiting for you.`,
        ),
        heading: t(`Yeni sayı başladı, ${ctx.name}! ✍️`, `A new issue has started, ${ctx.name}! ✍️`),
        paragraphs: [
          t(
            `"${ctx.groupName}" grubunda ${ctx.issueLabel} için sorular hazır. Birkaç satır, bir fotoğraf ya da kısa bir video bile yeter.`,
            `The questions for ${ctx.issueLabel} in "${ctx.groupName}" are ready. A few lines, a photo or a short video is plenty.`,
          ),
          t(
            `Son teslim: ${ctx.deadline}. Süre dolunca herkesin yanıtları tek bir gazetede buluşacak.`,
            `Deadline: ${ctx.deadline}. When time is up, everyone's answers will come together in one newspaper.`,
          ),
          t("Bu sayının soruları:", "This issue's questions:"),
        ],
        list: ctx.questions,
        cta: { label: t("Yanıtlamaya başla", "Start answering"), url: ctx.issueUrl },
        footer: footer(ctx),
      },
      ctx.locale,
    ),
  };
}

export function reminderEmail(ctx: IssueEmailContext & { deadline: string; timeLeft: string }) {
  const t = translator(ctx.locale);
  return {
    subject: t(`⏰ ${ctx.groupName}: son ${ctx.timeLeft}!`, `⏰ ${ctx.groupName}: ${ctx.timeLeft} left!`),
    ...renderEmail(
      {
        preheader: t(`Gazete ${ctx.deadline} tarihinde baskıya giriyor.`, `The newspaper goes to print on ${ctx.deadline}.`),
        heading: t(`Senin köşen hâlâ boş, ${ctx.name} 🙈`, `Your corner is still empty, ${ctx.name} 🙈`),
        paragraphs: [
          t(
            `"${ctx.groupName}" grubunun gazetesi ${ctx.deadline} tarihinde baskıya giriyor ve arkadaşların senden haber bekliyor.`,
            `The "${ctx.groupName}" newspaper goes to print on ${ctx.deadline}, and your friends are waiting to hear from you.`,
          ),
          t(
            "Uzun uzun yazmana gerek yok: tek bir cümle ya da bir fotoğraf bile gazeteyi güzelleştirir.",
            "No need to write a lot: even a single sentence or one photo makes the newspaper better.",
          ),
        ],
        cta: { label: t("Hemen yaz", "Write now"), url: ctx.issueUrl },
        footer: footer(ctx),
      },
      ctx.locale,
    ),
  };
}

export function publishedEmail(ctx: IssueEmailContext & { stats: string }) {
  const t = translator(ctx.locale);
  return {
    subject: t(`🎉 ${ctx.groupName} · ${ctx.issueLabel} yayında!`, `🎉 ${ctx.groupName} · ${ctx.issueLabel} is out!`),
    ...renderEmail(
      {
        preheader: t("Herkesin yanıtları bir araya geldi. Gazeten hazır!", "Everyone's answers are in. Your newspaper is ready!"),
        heading: t("Gazeteniz baskıdan çıktı! 🗞️", "Your newspaper is hot off the press! 🗞️"),
        paragraphs: [
          t(
            `Merhaba ${ctx.name}! "${ctx.groupName}" grubunun ${ctx.issueLabel} yayımlandı.`,
            `Hi ${ctx.name}! ${ctx.issueLabel} of "${ctx.groupName}" has been published.`,
          ),
          t(`${ctx.stats} Bir kahve al ve keyfini çıkar ☕`, `${ctx.stats} Grab a coffee and enjoy ☕`),
        ],
        cta: { label: t("Gazeteyi oku", "Read the newspaper"), url: ctx.issueUrl },
        footer: footer(ctx),
      },
      ctx.locale,
    ),
  };
}
