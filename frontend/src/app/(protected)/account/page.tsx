import { cookies } from "next/headers";
import type { ActiveSession } from "@/lib/types";
import AccountClient from "./AccountClient";

export default async function AccountPage() {
  const token = (await cookies()).get("auth-token")?.value;
  const res = await fetch(
    `${process.env.BACKEND_URL ?? "http://localhost:5281"}/api/auth/sessions`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error("Failed to load sessions");
  const sessions: ActiveSession[] = await res.json();
  return <AccountClient initialSessions={sessions} />;
}
