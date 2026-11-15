import "server-only";
import { gzipSync } from "node:zlib";
import type { SupabaseClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";
import { serverEnv } from "@/lib/server-env";
import { createAdminClient } from "@/lib/supabase/admin";

// Günlük yedek: veritabanının tamamı ve bütün fotoğraf, video, ses kayıtları
// site sahibinin Google Drive'ına kopyalanır ("Haber Var yedek" klasörü).
// Bir servis kapanırsa her şey buradan yeniden kurulabilir.
//
// Bağlantı bir kez /api/yedek üzerinden kurulur; Google'ın verdiği yenileme
// anahtarı app_secrets tablosunda durur. Drive'a sadece bu uygulamanın
// oluşturduğu dosyalar için izin istenir (drive.file kapsamı).

const DRIVE = "https://www.googleapis.com/drive/v3";
const UPLOAD = "https://www.googleapis.com/upload/drive/v3";
const FOLDER = "application/vnd.google-apps.folder";
const PAGE = 1000;

// Yedeklenen tablolar ve sayfalama için sıralama sütunu. app_secrets yedeklenmez.
const TABLES: Record<string, string> = {
  profiles: "id",
  groups: "id",
  group_members: "group_id",
  invites: "id",
  question_bank: "id",
  issues: "id",
  issue_questions: "id",
  responses: "id",
  response_media: "id",
  email_log: "issue_id",
  question_queue: "id",
  votes: "issue_question_id",
  reactions: "response_id",
  comments: "id",
  issue_schedules: "group_id",
  push_subscriptions: "id",
  push_log: "issue_id",
};

export interface BackupSummary {
  configured: boolean;
  /** partial: bir ya da birkaç tablo alınamadı; dosyada _errors altında yazar. */
  database?: "ok" | "partial" | "error";
  media?: { copied: number; pending: number; failed: number };
  error?: string;
}

interface Folders {
  root: string;
  db: string;
  media: string;
}

export function googleConfigured() {
  return Boolean(serverEnv.googleClientId && serverEnv.googleClientSecret);
}

async function secret(admin: SupabaseClient, key: string): Promise<string | null> {
  const { data, error } = await admin.from("app_secrets").select("value").eq("key", key).maybeSingle();
  if (error) throw error;
  return data?.value ?? null;
}

async function setSecret(admin: SupabaseClient, key: string, value: string) {
  const { error } = await admin.from("app_secrets").upsert({ key, value }, { onConflict: "key" });
  if (error) throw error;
}

/** Google'ın bağlantı kurulunca verdiği yenileme anahtarını saklar. */
export async function saveDriveToken(refreshToken: string) {
  await setSecret(createAdminClient(), "google_drive", JSON.stringify({ refresh_token: refreshToken }));
}

async function accessToken(admin: SupabaseClient): Promise<string | null> {
  const stored = await secret(admin, "google_drive");
  if (!stored) return null;
  const { refresh_token } = JSON.parse(stored) as { refresh_token: string };
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: serverEnv.googleClientId ?? "",
      client_secret: serverEnv.googleClientSecret ?? "",
      refresh_token,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Google anahtarı yenilenemedi (${res.status}): ${(await res.text()).slice(0, 200)}`);
  return ((await res.json()) as { access_token: string }).access_token;
}

class Drive {
  private token: string;
  constructor(token: string) {
    this.token = token;
  }

  private async call(url: string, init: RequestInit = {}) {
    const res = await fetch(url, { ...init, headers: { authorization: `Bearer ${this.token}`, ...(init.headers ?? {}) } });
    if (!res.ok) throw new Error(`Drive ${init.method ?? "GET"} ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return res;
  }

  async exists(id: string) {
    const res = await fetch(`${DRIVE}/files/${id}?fields=trashed`, { headers: { authorization: `Bearer ${this.token}` } });
    return res.ok && !((await res.json()) as { trashed: boolean }).trashed;
  }

  async createFolder(name: string, parent?: string) {
    const res = await this.call(`${DRIVE}/files?fields=id`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, mimeType: FOLDER, parents: parent ? [parent] : undefined }),
    });
    return ((await res.json()) as { id: string }).id;
  }

  /** Klasördeki dosyalar: ad → kimlik. */
  async list(folder: string): Promise<Map<string, string>> {
    const files = new Map<string, string>();
    let pageToken = "";
    do {
      const params = new URLSearchParams({
        q: `'${folder}' in parents and trashed = false`,
        fields: "nextPageToken, files(id, name)",
        pageSize: String(PAGE),
        pageToken,
      });
      const page = (await (await this.call(`${DRIVE}/files?${params}`)).json()) as {
        nextPageToken?: string;
        files: Array<{ id: string; name: string }>;
      };
      for (const f of page.files) files.set(f.name, f.id);
      pageToken = page.nextPageToken ?? "";
    } while (pageToken);
    return files;
  }

  /** Dosyayı yükler; aynı addaki dosya kimliği verilirse üzerine yazar. */
  async upload(name: string, parent: string, mimeType: string, content: Buffer, existingId?: string) {
    const boundary = "haber-var-yedek";
    const meta = JSON.stringify(existingId ? { name } : { name, parents: [parent] });
    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\ncontent-type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${boundary}\r\ncontent-type: ${mimeType}\r\n\r\n`),
      content,
      Buffer.from(`\r\n--${boundary}--`),
    ]);
    await this.call(`${UPLOAD}/files${existingId ? `/${existingId}` : ""}?uploadType=multipart&fields=id`, {
      method: existingId ? "PATCH" : "POST",
      headers: { "content-type": `multipart/related; boundary=${boundary}`, "content-length": String(body.length) },
      body,
    });
  }
}

/** "Haber Var yedek" klasörü ve altındaki iki klasör; silinmişse yeniden oluşturulur. */
async function folders(admin: SupabaseClient, drive: Drive): Promise<Folders> {
  const stored = await secret(admin, "backup_folders");
  let f = stored ? (JSON.parse(stored) as Folders) : null;
  if (f && (await drive.exists(f.root)) && (await drive.exists(f.db)) && (await drive.exists(f.media))) return f;
  const root = f && (await drive.exists(f.root)) ? f.root : await drive.createFolder("Haber Var yedek");
  f = { root, db: await drive.createFolder("veritabani", root), media: await drive.createFolder("medya", root) };
  await setSecret(admin, "backup_folders", JSON.stringify(f));
  return f;
}

async function allRows(admin: SupabaseClient, table: string, orderBy: string) {
  const rows: unknown[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await admin.from(table).select("*").order(orderBy).range(from, from + PAGE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) return rows;
  }
}

async function allUsers(admin: SupabaseClient) {
  const users: unknown[] = [];
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PAGE });
    if (error) throw error;
    users.push(
      ...data.users.map((u) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        providers: u.app_metadata?.providers,
        user_metadata: u.user_metadata,
      })),
    );
    if (data.users.length < PAGE) return users;
  }
}

/** Bir tablo okunamazsa diğerleri yine yazılır; hata dosyanın içinde (_errors) ve logda görünür. */
async function backupDatabase(admin: SupabaseClient, drive: Drive, f: Folders, now: Date): Promise<"ok" | "partial"> {
  const tables: Record<string, unknown[]> = {};
  const errors: Record<string, string> = {};
  const attempt = async (name: string, read: () => Promise<unknown[]>) => {
    try {
      tables[name] = await read();
    } catch (err) {
      errors[name] = err instanceof Error ? err.message : String(err);
      console.error("[yedek] tablo", name, errors[name]);
    }
  };
  for (const [table, orderBy] of Object.entries(TABLES)) await attempt(table, () => allRows(admin, table, orderBy));
  await attempt("auth_users", () => allUsers(admin));
  const dump = { taken_at: now.toISOString(), users: tables.auth_users ?? [], tables: { ...tables, auth_users: undefined }, _errors: errors };
  const name = `veritabani-${now.toISOString().slice(0, 10)}.json.gz`;
  const existing = await drive.list(f.db);
  await drive.upload(name, f.db, "application/gzip", gzipSync(JSON.stringify(dump)), existing.get(name));
  return Object.keys(errors).length ? "partial" : "ok";
}

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "audio/webm": "webm",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
};

/** Drive'da olmayan medya dosyalarını kopyalar; süre bitince kalanı ertesi güne bırakır. */
async function backupMedia(admin: SupabaseClient, drive: Drive, f: Folders, deadline: number) {
  const { data, error } = await admin.from("response_media").select("public_id, kind").order("created_at");
  if (error) throw error;
  const have = new Set([...(await drive.list(f.media)).keys()].map((n) => n.replace(/\.[a-z0-9]+$/i, "")));
  const result = { copied: 0, pending: 0, failed: 0 };
  const cloud = publicEnv.cloudinaryCloudName;
  for (const row of (data ?? []) as Array<{ public_id: string; kind: string }>) {
    const stem = row.public_id.replaceAll("/", "__");
    if (have.has(stem)) continue;
    if (Date.now() > deadline) {
      result.pending += 1;
      continue;
    }
    try {
      const type = row.kind === "image" ? "image" : "video";
      const res = await fetch(`https://res.cloudinary.com/${cloud}/${type}/upload/${row.public_id}`);
      if (!res.ok) throw new Error(`Cloudinary ${res.status}`);
      const mime = (res.headers.get("content-type") ?? "application/octet-stream").split(";")[0].trim();
      const ext = EXT[mime] ?? mime.split("/")[1] ?? "bin";
      await drive.upload(`${stem}.${ext}`, f.media, mime, Buffer.from(await res.arrayBuffer()));
      result.copied += 1;
    } catch (err) {
      result.failed += 1;
      console.error("[yedek] medya", row.public_id, err instanceof Error ? err.message : err);
    }
  }
  return result;
}

/**
 * Günlük yedek. Önce veritabanı (her gün yeni bir dosya), sonra henüz kopyalanmamış
 * medya. budgetMs dolunca durur; kalan medya ertesi gün devam eder. Hata zamanlanmış
 * işin diğer adımlarını durdurmaz.
 */
export async function runBackup(budgetMs: number, now = new Date()): Promise<BackupSummary> {
  const deadline = Date.now() + budgetMs;
  if (!googleConfigured()) return { configured: false };
  const admin = createAdminClient();
  const summary: BackupSummary = { configured: true };
  try {
    const token = await accessToken(admin);
    if (!token) return { configured: false };
    const drive = new Drive(token);
    const f = await folders(admin, drive);
    try {
      summary.database = await backupDatabase(admin, drive, f, now);
    } catch (err) {
      summary.database = "error";
      console.error("[yedek] veritabanı", err);
    }
    summary.media = await backupMedia(admin, drive, f, deadline);
  } catch (err) {
    summary.error = err instanceof Error ? err.message : String(err);
    console.error("[yedek]", err);
  }
  return summary;
}
