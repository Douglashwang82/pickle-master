import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/db";
import ClubForm from "@/components/clubs/ClubForm";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export default async function ClubSettingsPage({ params }: Params) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: club } = await supabaseAdmin
    .from("clubs")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!club) notFound();

  const { data: appUser } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("auth_provider_user_id", user.id)
    .single();

  if (!appUser) redirect("/login");

  const { data: membership } = await supabaseAdmin
    .from("club_memberships")
    .select("role, status")
    .eq("club_id", club.id)
    .eq("user_id", appUser.id)
    .single();

  if (membership?.role !== "leader" || membership?.status !== "active") {
    redirect(`/clubs/${slug}`);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Club Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">{club.name}</p>
      </div>
      <ClubForm club={club} />
    </div>
  );
}
