import "server-only";
import QRCode from "qrcode";
import { imageSrcSet, imageUrl, videoPosterUrl, videoUrl } from "@/lib/cloudinary-url";
import type { NewsAnswer, NewsMedia, NewsPerson, NewspaperData, NewsQuestion } from "@/lib/newspaper";
import { getT } from "@/lib/i18n-server";
import { createClient } from "@/lib/supabase/server";
import type { Issue, MediaRow, PersonSummary } from "@/lib/types";

interface Row {
  id: string;
  position: number;
  question_text: string;
  responses: Array<{
    id: string;
    body: string;
    user_id: string;
    updated_at: string;
    profiles: PersonSummary | null;
    response_media: MediaRow[];
  }>;
}

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
  const src = videoUrl(m.public_id);
  return {
    id: m.id,
    kind: "video",
    src,
    poster: videoPosterUrl(m.public_id),
    width: m.width,
    height: m.height,
    qrSvg: await QRCode.toString(src, { type: "svg", margin: 0, color: { dark: "#23242f", light: "#ffffff" } }),
  };
}

/** Yayımlanmış bir sayının tüm içeriği (RLS sayesinde sadece yayından sonra görünür). */
export async function getNewspaperData(
  issue: Pick<Issue, "id" | "number" | "title" | "published_at" | "deadline_at">,
  groupName: string,
): Promise<NewspaperData> {
  const t = await getT();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("issue_questions")
    .select(
      "id, position, question_text, responses ( id, body, user_id, updated_at, profiles ( display_name, avatar_url ), response_media ( id, response_id, kind, public_id, width, height, duration_s, bytes, position ) )",
    )
    .eq("issue_id", issue.id)
    .order("position");
  if (error) throw error;

  const questions: NewsQuestion[] = await Promise.all(
    ((data ?? []) as unknown as Row[]).map(async (q) => {
      const rows = [...(q.responses ?? [])]
        .filter((r) => r.body.trim() || r.response_media?.length)
        .sort((a, b) => a.updated_at.localeCompare(b.updated_at));
      const answers: NewsAnswer[] = await Promise.all(
        rows.map(async (r) => ({
          id: r.id,
          author: {
            id: r.user_id,
            name: r.profiles?.display_name ?? t("Bir arkadaş", "A friend"),
            avatarUrl: r.profiles?.avatar_url ?? null,
          },
          body: r.body.trim(),
          media: await Promise.all([...(r.response_media ?? [])].sort((a, b) => a.position - b.position).map(toNewsMedia)),
        })),
      );
      return { id: q.id, text: q.question_text, answers };
    }),
  );

  const contributors = new Map<string, NewsPerson>();
  const stats = { answers: 0, photos: 0, videos: 0 };
  for (const q of questions) {
    for (const a of q.answers) {
      contributors.set(a.author.id, a.author);
      stats.answers += 1;
      stats.photos += a.media.filter((m) => m.kind === "image").length;
      stats.videos += a.media.filter((m) => m.kind === "video").length;
    }
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
