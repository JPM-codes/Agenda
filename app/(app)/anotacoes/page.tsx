import { NotesView } from "@/components/notes/notes-view";

export default async function AnotacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ nova?: string; id?: string }>;
}) {
  const sp = await searchParams;
  return <NotesView initialNova={sp.nova === "1"} initialId={sp.id ? Number(sp.id) : null} />;
}
