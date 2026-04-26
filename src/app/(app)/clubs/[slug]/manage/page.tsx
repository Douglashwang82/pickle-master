import { redirect } from "next/navigation";

type Params = { params: Promise<{ slug: string }> };

export default async function ManageIndex({ params }: Params) {
  const { slug } = await params;
  redirect(`/clubs/${slug}/manage/overview`);
}
