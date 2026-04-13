import { redirect } from "next/navigation";

type Params = { params: Promise<{ slug: string }> };

export default async function NewSessionPageRedirect({ params }: Params) {
  const { slug } = await params;
  redirect(`/clubs/${slug}?tab=sessions`);
}
