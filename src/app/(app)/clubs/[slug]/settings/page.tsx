import { redirect } from "next/navigation";

type Params = { params: Promise<{ slug: string }> };

export default async function SettingsPageRedirect({ params }: Params) {
  const { slug } = await params;
  redirect(`/clubs/${slug}?tab=settings`);
}
