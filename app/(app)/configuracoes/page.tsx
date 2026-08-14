import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SettingsView } from "@/components/settings/settings-view";

export default async function ConfiguracoesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <SettingsView
      initialProfile={{ id: user.id, name: user.name, email: user.email, theme: user.theme }}
    />
  );
}
