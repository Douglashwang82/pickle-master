import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/db";
import ManageSidebar from "@/components/clubs/manage/ManageSidebar";

type Params = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export default async function ManageLayout({ children, params }: Params) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/clubs/${slug}/manage`);

  const { data: club } = await supabaseAdmin
    .from("clubs")
    .select("id, slug, name, owner_user_id")
    .eq("slug", slug)
    .eq("status", "active")
    .single();
  if (!club) notFound();

  const { data: appUser } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("auth_provider_user_id", user.id)
    .single();
  if (!appUser) notFound();

  let isLeader = club.owner_user_id === appUser.id;
  if (!isLeader) {
    const { data: mem } = await supabaseAdmin
      .from("club_memberships")
      .select("id")
      .eq("club_id", club.id)
      .eq("user_id", appUser.id)
      .eq("role", "leader")
      .eq("status", "active")
      .single();
    isLeader = Boolean(mem);
  }
  if (!isLeader) redirect(`/clubs/${slug}`);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          管理後台
        </p>
        <h1 className="text-2xl font-bold tracking-tight">{club.name}</h1>
      </div>
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <ManageSidebar slug={club.slug} />
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
