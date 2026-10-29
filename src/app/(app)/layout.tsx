import { AppFooter, AppHeader } from "@/components/app-header";
import { getMyProfile, requireUser } from "@/lib/auth";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  await requireUser();
  const profile = await getMyProfile();
  return (
    <>
      <AppHeader profile={profile} />
      <div className="flex-1">{children}</div>
      <AppFooter />
    </>
  );
}
