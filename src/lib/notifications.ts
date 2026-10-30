import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isEmailConfigured, sendEmail } from "@/lib/email/send";
import { issueOpenEmail, publishedEmail, reminderEmail } from "@/lib/email/templates";
import { formatDateTime, timeLeft } from "@/lib/format";
import { isLocale, translator, type Locale } from "@/lib/i18n";
import { issueLabel } from "@/lib/issues";
import { sendPush, type PushMessage, type PushTarget } from "@/lib/push";
import { appUrl } from "@/lib/server-env";
import { createAdminClient } from "@/lib/supabase/admin";

// E-posta kuralları:
//  • Sayı başlayınca herkese "yeni sayı" e-postası.
//  • Son 48 saatte, henüz hiçbir şey yazmamış olanlara tek bir hatırlatma.
//  • Sayı yayımlanınca herkese "gazete yayında" e-postası.
// Her e-posta email_log tablosuna yazılır; aynı e-posta asla iki kez gitmez.
// Telefon bildirimleri aynı kurallarla, bildirimleri açmış cihazlara gider ve
// push_log tablosuna yazılır. E-postayı kapatan biri de bildirim alabilir.

type EmailKind = "issue_open" | "reminder" | "published";

const REMINDER_WINDOW_MS = 48 * 60 * 60 * 1000;
const RECENT_PUBLISH_MS = 3 * 24 * 60 * 60 * 1000;

interface IssueRow {
  id: string;
  group_id: string;
  number: number;
  title: string | null;
  status: "open" | "published";
  deadline_at: string;
  published_at: string | null;
  groups: { name: string } | null;
}

interface Recipient {
  user_id: string;
  email: string;
  display_name: string;
  locale: Locale;
}

export interface NotificationSummary {
  published: number;
  emailConfigured: boolean;
  sent: Record<EmailKind, number>;
  pushed: Record<EmailKind, number>;
  failed: number;
}

/**
 * Süresi dolan sayıları yayımlar ve gereken e-postaları gönderir.
 * Zamanlanmış iş her gün çağırır; sayı başlatılınca/yayımlanınca da hemen çalışır.
 */
export async function runNotifications(options: { issueId?: string } = {}): Promise<NotificationSummary> {
  const admin = createAdminClient();
  const now = new Date();
  const summary: NotificationSummary = {
    published: 0,
    emailConfigured: isEmailConfigured(),
    sent: { issue_open: 0, reminder: 0, published: 0 },
    pushed: { issue_open: 0, reminder: 0, published: 0 },
    failed: 0,
  };

  let finalize = admin
    .from("issues")
    .update({ status: "published", published_at: now.toISOString() })
    .eq("status", "open")
    .lte("deadline_at", now.toISOString());
  if (options.issueId) finalize = finalize.eq("id", options.issueId);
  const { data: finalized, error: finalizeError } = await finalize.select("id");
  if (finalizeError) throw finalizeError;
  summary.published = finalized?.length ?? 0;

  const since = new Date(now.getTime() - RECENT_PUBLISH_MS).toISOString();
  let query = admin
    .from("issues")
    .select("id, group_id, number, title, status, deadline_at, published_at, groups ( name )")
    .or(`status.eq.open,and(status.eq.published,published_at.gte."${since}")`);
  if (options.issueId) query = query.eq("id", options.issueId);
  const { data: issues, error } = await query;
  if (error) throw error;

  for (const issue of (issues ?? []) as unknown as IssueRow[]) {
    if (summary.emailConfigured) await processIssue(admin, issue, summary);
    await processIssuePush(admin, issue, summary);
  }
  return summary;
}

async function processIssue(admin: SupabaseClient, issue: IssueRow, summary: NotificationSummary) {
  const [recipientsRes, logRes] = await Promise.all([
    admin.rpc("notification_recipients", { p_group_id: issue.group_id }),
    admin.from("email_log").select("user_id, kind").eq("issue_id", issue.id),
  ]);
  const sent = new Set((logRes.data ?? []).map((row) => `${row.user_id}:${row.kind}`));
  const recipients = await withLocales(admin, (recipientsRes.data ?? []) as Omit<Recipient, "locale">[]);
  const base = (person: Recipient) => {
    const t = translator(person.locale);
    return {
      locale: person.locale,
      groupName: issue.groups?.name ?? t("Grubun", "Your group"),
      issueLabel: issueLabel(issue, t),
      issueUrl: `${appUrl()}/sayi/${issue.id}`,
      profileUrl: `${appUrl()}/profil`,
    };
  };

  if (issue.status === "published") {
    const pending = recipients.filter((r) => !sent.has(`${r.user_id}:published`));
    if (!pending.length) return;
    const stats = await issueStats(admin, issue.id);
    if (!stats) return; // Kimse yazmadıysa "gazete yayında" demenin anlamı yok.
    for (const person of pending) {
      const email = publishedEmail({ ...base(person), name: person.display_name, stats: statsSentence(stats, person.locale) });
      await deliver(admin, issue.id, person, "published", email, summary);
    }
    return;
  }

  const msLeft = new Date(issue.deadline_at).getTime() - Date.now();
  let questions: string[] | null = null;
  let writers: Set<string> | null = null;

  for (const person of recipients) {
    if (!sent.has(`${person.user_id}:issue_open`)) {
      questions ??= await issueQuestions(admin, issue.id);
      await deliver(
        admin,
        issue.id,
        person,
        "issue_open",
        issueOpenEmail({
          ...base(person),
          name: person.display_name,
          deadline: formatDateTime(issue.deadline_at, person.locale),
          questions,
        }),
        summary,
      );
    } else if (msLeft <= REMINDER_WINDOW_MS && !sent.has(`${person.user_id}:reminder`)) {
      writers ??= await issueWriters(admin, issue.id);
      if (writers.has(person.user_id)) continue;
      await deliver(
        admin,
        issue.id,
        person,
        "reminder",
        reminderEmail({
          ...base(person),
          name: person.display_name,
          deadline: formatDateTime(issue.deadline_at, person.locale),
          timeLeft:
            timeLeft(issue.deadline_at, Date.now(), person.locale) ?? translator(person.locale)("birkaç dakika", "a few minutes"),
        }),
        summary,
      );
    }
  }
}

/** Önce kaydı ayırır, sonra gönderir: aynı anda çalışan iki işlem aynı e-postayı yollamaz. */
async function deliver(
  admin: SupabaseClient,
  issueId: string,
  person: Recipient,
  kind: EmailKind,
  email: { subject: string; html: string; text: string },
  summary: NotificationSummary,
) {
  const { data: claimed } = await admin
    .from("email_log")
    .upsert({ issue_id: issueId, user_id: person.user_id, kind }, { onConflict: "issue_id,user_id,kind", ignoreDuplicates: true })
    .select("user_id");
  if (!claimed?.length) return;

  const ok = await sendEmail({ to: person.email, ...email });
  if (ok) {
    summary.sent[kind] += 1;
  } else {
    summary.failed += 1;
    await admin.from("email_log").delete().match({ issue_id: issueId, user_id: person.user_id, kind });
  }
}

// ─── Telefon bildirimleri ───────────────────────────────────────────────────

type PushRecipient = { user_id: string; locale: Locale };

/** E-postayla aynı kurallar: yeni sayı, son 48 saatte tek hatırlatma, gazete yayında. Hata e-postaları durdurmaz. */
async function processIssuePush(admin: SupabaseClient, issue: IssueRow, summary: NotificationSummary) {
  try {
    const { data: members, error: membersError } = await admin.from("group_members").select("user_id").eq("group_id", issue.group_id);
    if (membersError) throw membersError;
    const memberIds = (members ?? []).map((m) => m.user_id as string);
    if (!memberIds.length) return;

    const [subsRes, logRes] = await Promise.all([
      admin.from("push_subscriptions").select("id, user_id, endpoint, p256dh, auth").in("user_id", memberIds),
      admin.from("push_log").select("user_id, kind").eq("issue_id", issue.id),
    ]);
    if (subsRes.error) throw subsRes.error;
    if (logRes.error) throw logRes.error;

    const devices = new Map<string, PushTarget[]>();
    for (const target of (subsRes.data ?? []) as PushTarget[]) {
      devices.set(target.user_id, [...(devices.get(target.user_id) ?? []), target]);
    }
    if (!devices.size) return;
    const sent = new Set((logRes.data ?? []).map((row) => `${row.user_id}:${row.kind}`));
    const people = await withLocales(admin, [...devices.keys()].map((user_id) => ({ user_id })));

    const msLeft = new Date(issue.deadline_at).getTime() - Date.now();
    let writers: Set<string> | null = null;
    let stats: IssueStats | null | undefined;

    for (const person of people) {
      let kind: EmailKind | null = null;
      if (issue.status === "published") {
        if (!sent.has(`${person.user_id}:published`)) {
          if (stats === undefined) stats = await issueStats(admin, issue.id);
          if (stats) kind = "published";
        }
      } else if (!sent.has(`${person.user_id}:issue_open`)) {
        kind = "issue_open";
      } else if (msLeft <= REMINDER_WINDOW_MS && !sent.has(`${person.user_id}:reminder`)) {
        writers ??= await issueWriters(admin, issue.id);
        if (!writers.has(person.user_id)) kind = "reminder";
      }
      if (kind) await deliverPush(admin, issue, person, kind, devices.get(person.user_id) ?? [], stats ?? null, summary);
    }
  } catch (error) {
    console.error("[bildirim]", issue.id, error);
  }
}

/** E-postadaki gibi önce kaydı ayırır; hiçbir cihaza ulaşamazsa kaydı geri alır, sonraki çalışmada tekrar denenir. */
async function deliverPush(
  admin: SupabaseClient,
  issue: IssueRow,
  person: PushRecipient,
  kind: EmailKind,
  devices: PushTarget[],
  stats: IssueStats | null,
  summary: NotificationSummary,
) {
  const { data: claimed } = await admin
    .from("push_log")
    .upsert({ issue_id: issue.id, user_id: person.user_id, kind }, { onConflict: "issue_id,user_id,kind", ignoreDuplicates: true })
    .select("user_id");
  if (!claimed?.length) return;

  const result = await sendPush(admin, devices, pushMessage(kind, issue, person.locale, stats));
  if (result.sent) {
    summary.pushed[kind] += 1;
  } else if (result.failed) {
    summary.failed += 1;
    await admin.from("push_log").delete().match({ issue_id: issue.id, user_id: person.user_id, kind });
  }
}

function pushMessage(kind: EmailKind, issue: IssueRow, locale: Locale, stats: IssueStats | null): PushMessage {
  const t = translator(locale);
  const groupName = issue.groups?.name ?? t("Grubun", "Your group");
  const label = issueLabel(issue, t);
  const base = { url: `/sayi/${issue.id}`, tag: `${issue.id}:${kind}` };
  if (kind === "issue_open") {
    const deadline = formatDateTime(issue.deadline_at, locale);
    return {
      ...base,
      title: groupName,
      body: t(`${label} başladı. Son teslim: ${deadline}.`, `${label} has started. Deadline: ${deadline}.`),
    };
  }
  if (kind === "reminder") {
    const left = timeLeft(issue.deadline_at, Date.now(), locale) ?? t("birkaç dakika", "a few minutes");
    return {
      ...base,
      title: groupName,
      body: t(`${label} için son ${left}. Henüz yazmadın.`, `${left} left for ${label}. You haven't written yet.`),
    };
  }
  const summaryLine = stats ? ` ${statsSentence(stats, locale)}` : "";
  return { ...base, title: groupName, body: t(`${label} yayında.`, `${label} is out.`) + summaryLine };
}

/**
 * Bildirimleri yeni açan kişiye, zaten bildiği şeyler için bildirim gelmesin:
 * gruplarındaki açık sayılar "yeni sayı", son günlerde yayımlananlar "gazete yayında" sayılır.
 */
export async function skipPastPushEvents(userId: string) {
  const admin = createAdminClient();
  const { data: groups } = await admin.from("group_members").select("group_id").eq("user_id", userId);
  const groupIds = (groups ?? []).map((g) => g.group_id as string);
  if (!groupIds.length) return;
  const since = new Date(Date.now() - RECENT_PUBLISH_MS).toISOString();
  const { data: issues } = await admin
    .from("issues")
    .select("id, status")
    .in("group_id", groupIds)
    .or(`status.eq.open,and(status.eq.published,published_at.gte."${since}")`);
  const rows = (issues ?? []).map((i) => ({
    issue_id: i.id as string,
    user_id: userId,
    kind: (i.status === "open" ? "issue_open" : "published") as EmailKind,
  }));
  if (rows.length) await admin.from("push_log").upsert(rows, { onConflict: "issue_id,user_id,kind", ignoreDuplicates: true });
}

async function issueQuestions(admin: SupabaseClient, issueId: string): Promise<string[]> {
  const { data } = await admin
    .from("issue_questions")
    .select("question_text")
    .eq("issue_id", issueId)
    .order("position");
  return (data ?? []).map((q) => q.question_text as string);
}

type ResponseStatsRow = { user_id: string; body: string; response_media: { kind: string }[] };

async function loadResponses(admin: SupabaseClient, issueId: string): Promise<ResponseStatsRow[]> {
  const { data } = await admin.from("responses").select("user_id, body, response_media ( kind )").eq("issue_id", issueId);
  return ((data ?? []) as ResponseStatsRow[]).filter((r) => r.body.trim() || r.response_media.length);
}

async function loadVoters(admin: SupabaseClient, issueId: string): Promise<string[]> {
  const { data } = await admin.from("votes").select("user_id").eq("issue_id", issueId);
  return (data ?? []).map((v) => v.user_id as string);
}

/** Yazan ya da oy veren herkes (hatırlatma e-postası bunlara gitmez). */
async function issueWriters(admin: SupabaseClient, issueId: string): Promise<Set<string>> {
  const [rows, voters] = await Promise.all([loadResponses(admin, issueId), loadVoters(admin, issueId)]);
  return new Set([...rows.map((r) => r.user_id), ...voters]);
}

interface IssueStats {
  writers: number;
  answers: number;
  photos: number;
  videos: number;
  audios: number;
  votes: number;
}

/** Kimse yazmadıysa ve oy vermediyse null. */
async function issueStats(admin: SupabaseClient, issueId: string): Promise<IssueStats | null> {
  const [rows, voters] = await Promise.all([loadResponses(admin, issueId), loadVoters(admin, issueId)]);
  if (!rows.length && !voters.length) return null;
  const media = rows.flatMap((r) => r.response_media);
  return {
    writers: new Set([...rows.map((r) => r.user_id), ...voters]).size,
    answers: rows.length,
    photos: media.filter((m) => m.kind === "image").length,
    videos: media.filter((m) => m.kind === "video").length,
    audios: media.filter((m) => m.kind === "audio").length,
    votes: voters.length,
  };
}

/** "4 arkadaş katıldı: 15 yanıt, 6 fotoğraf, 2 video ve 9 oy." */
function statsSentence(stats: IssueStats, locale: Locale): string {
  const en = locale === "en";
  const n = (count: number, tr: string, one: string, many: string) => `${count} ${en ? (count === 1 ? one : many) : tr}`;
  const parts = [
    stats.answers ? n(stats.answers, "yanıt", "answer", "answers") : null,
    stats.photos ? n(stats.photos, "fotoğraf", "photo", "photos") : null,
    stats.videos ? n(stats.videos, "video", "video", "videos") : null,
    stats.audios ? n(stats.audios, "sesli not", "voice note", "voice notes") : null,
    stats.votes ? n(stats.votes, "oy", "vote", "votes") : null,
  ].filter(Boolean);
  const and = en ? "and" : "ve";
  const list = parts.length > 1 ? `${parts.slice(0, -1).join(", ")} ${and} ${parts.at(-1)}` : parts[0];
  return en
    ? `${n(stats.writers, "", "friend", "friends")} took part: ${list}.`
    : `${stats.writers} arkadaş katıldı: ${list}.`;
}

/**
 * Her alıcının dili, hesabına kayıtlı tercihten gelir (dil düğmesi kaydeder).
 * Gruplar küçük olduğu için kişi başı tek bir sorgu sorun değil.
 */
async function withLocales<P extends { user_id: string }>(admin: SupabaseClient, people: P[]): Promise<Array<P & { locale: Locale }>> {
  return Promise.all(
    people.map(async (person) => {
      const { data } = await admin.auth.admin.getUserById(person.user_id);
      const saved = data.user?.user_metadata?.locale;
      return { ...person, locale: isLocale(saved) ? saved : "tr" };
    }),
  );
}
