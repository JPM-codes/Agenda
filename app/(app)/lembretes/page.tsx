import { RemindersView } from "@/components/reminders/reminders-view";

export default async function LembretesPage({
  searchParams,
}: {
  searchParams: Promise<{ nova?: string; id?: string }>;
}) {
  const sp = await searchParams;
  return <RemindersView initialNova={sp.nova === "1"} initialId={sp.id ? Number(sp.id) : null} />;
}
