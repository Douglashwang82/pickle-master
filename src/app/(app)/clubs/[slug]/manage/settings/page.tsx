import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/db";
import ClubForm from "@/components/clubs/ClubForm";
import InviteLinkManager from "@/components/clubs/InviteLinkManager";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export default async function ManageSettingsPage({ params }: Params) {
  const { slug } = await params;

  const { data: club } = await supabaseAdmin
    .from("clubs")
    .select("*")
    .eq("slug", slug)
    .single();
  if (!club) notFound();

  return (
    <div className="space-y-8">
      <ClubForm club={club} />
      <Separator />
      <InviteLinkManager clubId={club.id} />
    </div>
  );
}
