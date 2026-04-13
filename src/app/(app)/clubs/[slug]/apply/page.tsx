import { redirect } from "next/navigation";

type Params = { params: Promise<{ slug: string }> };

export default async function ApplyPageRedirect({ params }: Params) {
  const { slug } = await params;
  redirect(`/clubs/${slug}?tab=info`);
}
