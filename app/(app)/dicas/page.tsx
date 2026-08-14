import { TipsView } from "@/components/tips/tips-view";

export default async function DicasPage({
  searchParams,
}: {
  searchParams: Promise<{ nova?: string; id?: string }>;
}) {
  const sp = await searchParams;
  return <TipsView initialNova={sp.nova === "1"} initialId={sp.id ? Number(sp.id) : null} />;
}
