import { redirect } from "next/navigation";

type Params = { params: Promise<{ slug: string }> };

export default async function SessionsPageRedirect({ params }: Params) {
  const { slug } = await params;
  redirect(`/clubs/${slug}?tab=sessions`);
}
