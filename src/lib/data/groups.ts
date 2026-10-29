import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Group, Issue, Member, MemberRole } from "@/lib/types";

export type IssueSummary = Pick<
  Issue,
  "id" | "number" | "title" | "status" | "template" | "deadline_at" | "opened_at" | "published_at"
>;

const ISSUE_SUMMARY = "id, number, title, status, template, deadline_at, opened_at, published_at";
const MEMBER_FIELDS = "user_id, role, joined_at, profiles ( display_name, avatar_url )";

export interface GroupListItem {
  id: string;
  name: string;
  description: string | null;
  myRole: MemberRole;
  members: Member[];
  issues: IssueSummary[];
}

export async function listMyGroups(userId: string): Promise<GroupListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("groups")
    .select(`id, name, description, created_at, group_members ( ${MEMBER_FIELDS} ), issues ( ${ISSUE_SUMMARY} )`)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((g) => {
    const members = (g.group_members ?? []) as unknown as Member[];
    return {
      id: g.id,
      name: g.name,
      description: g.description,
      myRole: members.find((m) => m.user_id === userId)?.role ?? "member",
      members,
      issues: ((g.issues ?? []) as IssueSummary[]).sort((a, b) => b.number - a.number),
    };
  });
}

export interface GroupPageData {
  group: Group;
  members: Member[];
  issues: IssueSummary[];
  myRole: MemberRole;
}

/** Grup sayfası için her şey. Üye değilsen (RLS) null döner. Aynı istekte tekrar çağırmak ücretsizdir. */
export const getGroupPageData = cache(async (groupId: string, userId: string): Promise<GroupPageData | null> => {
  const supabase = await createClient();
  const [groupRes, membersRes, issuesRes] = await Promise.all([
    supabase.from("groups").select("id, name, description, default_template, default_design, created_at").eq("id", groupId).maybeSingle(),
    supabase.from("group_members").select(MEMBER_FIELDS).eq("group_id", groupId).order("joined_at"),
    supabase.from("issues").select(ISSUE_SUMMARY).eq("group_id", groupId).order("number", { ascending: false }),
  ]);
  if (groupRes.error) throw groupRes.error;
  if (!groupRes.data) return null;

  const members = (membersRes.data ?? []) as unknown as Member[];
  const me = members.find((m) => m.user_id === userId);
  if (!me) return null;

  return {
    group: groupRes.data as Group,
    members,
    issues: (issuesRes.data ?? []) as IssueSummary[],
    myRole: me.role,
  };
});

export async function getMembers(groupId: string): Promise<Member[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("group_members").select(MEMBER_FIELDS).eq("group_id", groupId).order("joined_at");
  return (data ?? []) as unknown as Member[];
}

/** Grubun geçerli davet kodu (sadece yöneticiler görebilir). */
export async function getActiveInviteToken(groupId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invites")
    .select("token")
    .eq("group_id", groupId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.token ?? null;
}
