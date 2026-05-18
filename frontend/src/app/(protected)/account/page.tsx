"use client";

import { useEffect, useState } from "react";
import { api, logout as logoutApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import type { MessageResponse, ActiveSession } from "@/lib/types";

export default function AccountPage() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  useEffect(() => {
    api.get<ActiveSession[]>("/auth/sessions")
      .then(setSessions)
      .catch((err) => setSessionsError(err.message))
      .finally(() => setSessionsLoading(false));
  }, []);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);
    setPwLoading(true);
    try {
      await api.post<MessageResponse>("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      setPwSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setPwLoading(false);
    }
  }

  async function handleRevokeSession(id: number, isCurrent: boolean) {
    await api.delete(`/auth/sessions/${id}`);
    if (isCurrent) {
      await logoutApi();
      router.push("/login");
      return;
    }
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-8 flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Account</h1>

      <div className="bg-white border border-zinc-200 rounded-lg p-6">
        <h2 className="text-base font-medium mb-4">Change Password</h2>
        <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="border border-zinc-300 rounded px-3 py-2 text-sm outline-none focus:border-black"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="border border-zinc-300 rounded px-3 py-2 text-sm outline-none focus:border-black"
            />
            <p className="text-xs text-zinc-400">
              Min 8 chars — uppercase, lowercase, number, special character.
            </p>
          </div>
          {pwError && <p className="text-red-600 text-sm">{pwError}</p>}
          {pwSuccess && <p className="text-green-600 text-sm">Password changed successfully.</p>}
          <button
            type="submit"
            disabled={pwLoading}
            className="bg-black text-white rounded px-4 py-2 text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 self-start"
          >
            {pwLoading ? "Saving…" : "Change Password"}
          </button>
        </form>
      </div>

      <div className="bg-white border border-zinc-200 rounded-lg p-6">
        <h2 className="text-base font-medium mb-4">Active Sessions</h2>
        {sessionsLoading && <p className="text-zinc-400 text-sm">Loading…</p>}
        {sessionsError && <p className="text-red-600 text-sm">{sessionsError}</p>}
        {!sessionsLoading && sessions.length === 0 && (
          <p className="text-zinc-400 text-sm">No active sessions.</p>
        )}
        <ul className="flex flex-col gap-3">
          {sessions.map((s) => (
            <li key={s.id} className="flex items-start justify-between gap-4 text-sm">
              <div className="flex flex-col gap-0.5">
                <span className="text-zinc-800 truncate max-w-xs" title={s.deviceInfo}>
                  {s.deviceInfo || "Unknown device"}
                </span>
                <span className="text-zinc-400 text-xs">
                  Signed in {new Date(s.createdAt).toLocaleDateString()}
                  {s.isCurrent && (
                    <span className="ml-2 text-green-600 font-medium">Current</span>
                  )}
                </span>
              </div>
              <button
                onClick={() => handleRevokeSession(s.id, s.isCurrent)}
                className="text-red-500 hover:text-red-700 shrink-0"
              >
                {s.isCurrent ? "Log out" : "Revoke"}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
