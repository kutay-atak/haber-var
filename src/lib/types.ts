// Veritabanı satırlarının uygulamada kullandığımız biçimleri.
// Şema: supabase/migrations/ (init + editors_polls_social)

export type MemberRole = "admin" | "editor" | "member";
export type IssueStatus = "draft" | "open" | "published";
export type TemplateId =
  | "classic"
  | "magazine"
  | "scrapbook"
  | "letter"
  | "album"
  | "minimal"
  | "night"
  | "tabloid"
  | "retro";
export type MediaKind = "image" | "video" | "audio";
/** Yazılı soru, anket ya da "kim daha çok?" sorusu */
export type QuestionKind = "text" | "poll" | "who";

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  email_opt_in: boolean;
}

export type PersonSummary = Pick<Profile, "display_name" | "avatar_url">;

export interface Group {
  id: string;
  name: string;
  description: string | null;
  default_template: TemplateId;
  /** Gazete tasarım stüdyosu ayarları (bkz. src/lib/design.ts) */
  default_design: unknown;
  created_at: string;
}

export interface Member {
  user_id: string;
  role: MemberRole;
  joined_at: string;
  profiles: PersonSummary | null;
}

export interface Issue {
  id: string;
  group_id: string;
  number: number;
  title: string | null;
  status: IssueStatus;
  template: TemplateId;
  /** Gazete tasarım stüdyosu ayarları (bkz. src/lib/design.ts) */
  design: unknown;
  deadline_at: string;
  opened_at: string | null;
  published_at: string | null;
  created_at: string;
}

export interface IssueQuestion {
  id: string;
  issue_id: string;
  position: number;
  question_text: string;
  source_question_id: string | null;
  kind: QuestionKind;
  /** Anket seçenekleri (sadece "poll") */
  options: string[] | null;
  /** Soruyu sıraya ekleyen editör */
  asked_by: string | null;
}

export interface BankQuestion {
  id: string;
  text: string;
  category: string;
  group_id: string | null;
  kind: QuestionKind;
  options: string[] | null;
}

/** Editörlerin sıradaki sayı için önerdiği soru */
export interface QueuedQuestion {
  id: string;
  text: string;
  kind: QuestionKind;
  options: string[] | null;
  source_question_id: string | null;
  added_by: string | null;
  created_at: string;
  profiles: PersonSummary | null;
}

export type ScheduleFrequency = "weekly" | "biweekly" | "monthly";

export interface IssueSchedule {
  group_id: string;
  enabled: boolean;
  frequency: ScheduleFrequency;
  /** 1 = Pazartesi … 7 = Pazar */
  weekday: number | null;
  month_day: number | null;
  duration_days: number;
  question_count: number;
  locale: "tr" | "en";
  next_run_at: string;
  last_run_at: string | null;
}

export type ReactionKey = "heart" | "laugh" | "wow" | "sad" | "clap" | "fire";

export interface MediaRow {
  id: string;
  response_id: string;
  kind: MediaKind;
  public_id: string;
  width: number | null;
  height: number | null;
  duration_s: number | null;
  bytes: number;
  position: number;
}
