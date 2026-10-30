import { AppFooter, AppHeader } from "@/components/app-header";
import { PushSync } from "@/components/pwa/pwa";
import { getMyProfile, requireUser } from "@/lib/auth";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const profile = await getMyProfile();
  return (
    <>
      <AppHeader profile={profile} />
      <div className="flex-1">{children}</div>
      <AppFooter />
      <PushSync userId={user.id} />
    </>
  );
}
