import "server-only";
import QRCode from "qrcode";
import { audioUrl, imageSrcSet, imageUrl, videoPosterUrl, videoUrl } from "@/lib/cloudinary-url";
import type { NewsAnswer, NewsMedia, NewsPerson, NewspaperData, NewsQuestion, VoteResults } from "@/lib/newspaper";
import { getT } from "@/lib/i18n-server";
import { createClient } from "@/lib/supabase/server";
import type { Issue, MediaRow, PersonSummary, QuestionKind, ReactionKey } from "@/lib/types";

interface Row {
  id: string;
  position: number;
  question_text: string;
  kind: QuestionKind;
  options: string[] | null;
  asked_by: string | null;
  responses: Array<{
    id: string;
    body: string;
    user_id: string;
    updated_at: string;
    profiles: PersonSummary | null;
    response_media: MediaRow[];
  }>;
}

interface VoteRow {
  issue_question_id: string;
  user_id: string;
  choice: number | null;
}

/** "Kim daha çok?" oyları gizli: veritabanı sadece kimin kaç oy aldığını verir. */
interface WhoCount {
  question_id: string;
  person_id: string;
  vote_count: number;
}

const qr = (url: string) => QRCode.toString(url, { type: "svg", margin: 0, color: { dark: "#23242f", light: "#ffffff" } });

async function toNewsMedia(m: MediaRow): Promise<NewsMedia> {
  if (m.kind === "image") {
    return {
      id: m.id,
      kind: "image",
      src: imageUrl(m.public_id, { width: 1200 }),
      srcSet: imageSrcSet(m.public_id),
      width: m.width,
      height: m.height,
    };
  }
  if (m.kind === "audio") {
    const src = audioUrl(m.public_id);
    return { id: m.id, kind: "audio", src, width: null, height: null, duration: m.duration_s, qrSvg: await qr(src) };
  }
  const src = videoUrl(m.public_id);
  return {
    id: m.id,
    kind: "video",
    src,
    poster: videoPosterUrl(m.public_id),
    width: m.width,
    height: m.height,
    duration: m.duration_s,
    qrSvg: await qr(src),
  };
}

/** Oyları grafiklere hazır sonuçlara çevirir. */
function tally(q: Row, votes: VoteRow[], whoCounts: WhoCount[], person: (id: string) => NewsPerson): VoteResults | null {
  if (q.kind === "text") return null;
  if (q.kind === "poll") {
    const mine = votes.filter((v) => v.issue_question_id === q.id && v.choice !== null);
    const options = (q.options ?? []).map((label, i) => {
      const chosen = mine.filter((v) => v.choice === i);
      return {
        label,
        votes: chosen.length,
        voters: chosen.map((v) => person(v.user_id)),
      };
    });
    return { kind: "poll", total: mine.length, options };
  }
  const options = whoCounts
    .filter((c) => c.question_id === q.id)
    .map((c) => ({ person: person(c.person_id), votes: c.vote_count }))
    .sort((a, b) => b.votes - a.votes || a.person.name.localeCompare(b.person.name))
    .map((o) => ({ label: o.person.name, votes: o.votes, voters: [], person: o.person }));
  return { kind: "who", total: options.reduce((sum, o) => sum + o.votes, 0), options };
}

/** Yayımlanmış bir sayının tüm içeriği (RLS sayesinde sadece yayından sonra görünür). */
export async function getNewspaperData(
  issue: Pick<Issue, "id" | "group_id" | "number" | "title" | "published_at" | "deadline_at">,
  groupName: string,
): Promise<NewspaperData> {
  const t = await getT();
  const supabase = await createClient();
  const [questionsRes, votesRes, whoRes, participantsRes, membersRes] = await Promise.all([
    // reactions tablosu yanıtlarla profiller arasında ikinci bir bağ kurduğu için
    // yazarın profili, hangi yabancı anahtardan geleceği belirtilerek istenir.
    supabase
      .from("issue_questions")
      .select(
        "id, position, question_text, kind, options, asked_by, responses ( id, body, user_id, updated_at, profiles!responses_user_id_fkey ( display_name, avatar_url ), response_media ( id, response_id, kind, public_id, width, height, duration_s, bytes, position ) )",
      )
      .eq("issue_id", issue.id)
      .order("position"),
    // Anket oyları (adlarıyla) ve kendi oyun; başkalarının "kim daha çok?" oyları RLS ile gizli.
    supabase.from("votes").select("issue_question_id, user_id, choice").eq("issue_id", issue.id),
    supabase.rpc("who_vote_counts", { p_issue_id: issue.id }),
    supabase.rpc("issue_participants", { p_issue_id: issue.id }),
    supabase.from("group_members").select("user_id, profiles ( display_name, avatar_url )").eq("group_id", issue.group_id),
  ]);
  if (questionsRes.error) throw questionsRes.error;

  const people = new Map<string, NewsPerson>();
  for (const m of (membersRes.data ?? []) as unknown as Array<{ user_id: string; profiles: PersonSummary | null }>) {
    people.set(m.user_id, {
      id: m.user_id,
      name: m.profiles?.display_name ?? t("Bir arkadaş", "A friend"),
      avatarUrl: m.profiles?.avatar_url ?? null,
    });
  }
  // Gruptan ayrılan biri de olsa yazdığı ya da oy aldığı gazetede yer alsın.
  const person = (id: string): NewsPerson => people.get(id) ?? { id, name: t("Bir arkadaş", "A friend"), avatarUrl: null };
  const pollVotes = ((votesRes.data ?? []) as VoteRow[]).filter((v) => v.choice !== null);
  const whoCounts = (whoRes.data ?? []) as WhoCount[];

  const questions: NewsQuestion[] = await Promise.all(
    ((questionsRes.data ?? []) as unknown as Row[]).map(async (q) => {
      const rows = [...(q.responses ?? [])]
        .filter((r) => r.body.trim() || r.response_media?.length)
        .sort((a, b) => a.updated_at.localeCompare(b.updated_at));
      const answers: NewsAnswer[] = await Promise.all(
        rows.map(async (r) => ({
          id: r.id,
          // Gruptan ayrılan biri de olsa yazdığı gazetede adıyla kalsın.
          author: people.get(r.user_id) ?? {
            id: r.user_id,
            name: r.profiles?.display_name ?? t("Bir arkadaş", "A friend"),
            avatarUrl: r.profiles?.avatar_url ?? null,
          },
          body: r.body.trim(),
          media: await Promise.all([...(r.response_media ?? [])].sort((a, b) => a.position - b.position).map(toNewsMedia)),
        })),
      );
      return {
        id: q.id,
        text: q.question_text,
        answers,
        kind: q.kind,
        askedBy: q.asked_by ? (people.get(q.asked_by) ?? null) : null,
        vote: tally(q, pollVotes, whoCounts, person),
      };
    }),
  );

  const contributors = new Map<string, NewsPerson>();
  const stats = {
    answers: 0,
    photos: 0,
    videos: 0,
    audios: 0,
    votes: pollVotes.length + whoCounts.reduce((sum, c) => sum + c.vote_count, 0),
  };
  for (const q of questions) {
    for (const a of q.answers) {
      contributors.set(a.author.id, a.author);
      stats.answers += 1;
      stats.photos += a.media.filter((m) => m.kind === "image").length;
      stats.videos += a.media.filter((m) => m.kind === "video").length;
      stats.audios += a.media.filter((m) => m.kind === "audio").length;
    }
  }
  // Sadece oy verenler de "bu sayıda yazanlar" listesinde yer alsın.
  for (const id of (participantsRes.data ?? []) as string[]) {
    const voter = people.get(id);
    if (voter && !contributors.has(voter.id)) contributors.set(voter.id, voter);
  }

  return {
    groupName,
    issueNumber: issue.number,
    issueTitle: issue.title,
    publishedAt: issue.published_at ?? issue.deadline_at,
    contributors: [...contributors.values()],
    questions,
    stats,
  };
}

// ─── Tepkiler ve yorumlar ────────────────────────────────────────────────────

export interface SocialComment {
  id: string;
  userId: string;
  author: NewsPerson;
  body: string;
  createdAt: string;
}

export interface SocialData {
  myId: string;
  isAdmin: boolean;
  /** Yanıt kimliği → tepki → tepki verenlerin kimlikleri */
  reactions: Record<string, Partial<Record<ReactionKey, string[]>>>;
  /** Yanıt kimliği → yorumlar (eskiden yeniye) */
  comments: Record<string, SocialComment[]>;
  /** Tepki verenlerin adları (ipucu balonları için) */
  names: Record<string, string>;
}

/** Yayımlanmış sayının tepki ve yorumları. */
export async function getSocialData(issueId: string, myId: string, isAdmin: boolean): Promise<SocialData> {
  const t = await getT();
  const supabase = await createClient();
  const [reactionsRes, commentsRes] = await Promise.all([
    supabase.from("reactions").select("response_id, user_id, emoji, profiles ( display_name )").eq("issue_id", issueId),
    supabase
      .from("comments")
      .select("id, response_id, user_id, body, created_at, profiles ( display_name, avatar_url )")
      .eq("issue_id", issueId)
      .order("created_at"),
  ]);

  const names: Record<string, string> = {};
  const reactions: SocialData["reactions"] = {};
  for (const r of (reactionsRes.data ?? []) as unknown as Array<{
    response_id: string;
    user_id: string;
    emoji: ReactionKey;
    profiles: { display_name: string } | null;
  }>) {
    names[r.user_id] = r.profiles?.display_name ?? t("Bir arkadaş", "A friend");
    const forResponse = (reactions[r.response_id] ??= {});
    (forResponse[r.emoji] ??= []).push(r.user_id);
  }

  const comments: SocialData["comments"] = {};
  for (const c of (commentsRes.data ?? []) as unknown as Array<{
    id: string;
    response_id: string;
    user_id: string;
    body: string;
    created_at: string;
    profiles: PersonSummary | null;
  }>) {
    (comments[c.response_id] ??= []).push({
      id: c.id,
      userId: c.user_id,
      author: {
        id: c.user_id,
        name: c.profiles?.display_name ?? t("Bir arkadaş", "A friend"),
        avatarUrl: c.profiles?.avatar_url ?? null,
      },
      body: c.body,
      createdAt: c.created_at,
    });
  }

  return { myId, isAdmin, reactions, comments, names };
}
