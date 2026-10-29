// Veritabanı satırlarının uygulamada kullandığımız biçimleri.
// Şema: supabase/migrations/20261029090000_init.sql

export type MemberRole = "admin" | "member";
export type IssueStatus = "draft" | "open" | "published";
export type TemplateId = "classic" | "magazine" | "scrapbook";
export type MediaKind = "image" | "video";

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
}

export interface BankQuestion {
  id: string;
  text: string;
  category: string;
  group_id: string | null;
}

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
