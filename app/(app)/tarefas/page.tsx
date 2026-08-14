import { TasksView } from "@/components/tasks/tasks-view";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ nova?: string; id?: string }>;
}) {
  const sp = await searchParams;
  return <TasksView initialNova={sp.nova === "1"} initialId={sp.id ? Number(sp.id) : null} />;
}
