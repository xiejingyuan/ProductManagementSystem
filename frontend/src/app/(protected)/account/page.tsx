import type { ActiveSession } from "@/lib/types";
import { serverFetch } from "@/lib/server-api";
import AccountClient from "./AccountClient";

export default async function AccountPage() {
  const sessions = await serverFetch<ActiveSession[]>("/api/auth/sessions");
  return <AccountClient initialSessions={sessions} />;
}
