"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { MessageResponse, ActiveSession } from "@/lib/types";
import { validatePassword } from "@/lib/validation";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export default function AccountClient({ initialSessions }: { initialSessions: ActiveSession[] }) {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const [sessions, setSessions] = useState(initialSessions);

  async function handleChangePassword(e: React.SyntheticEvent) {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);

    const validationError = validatePassword(newPassword);
    if (validationError) { setPwError(validationError); return; }
    if (newPassword === currentPassword) { setPwError("New password must be different from current password."); return; }
    if (newPassword !== confirmPassword) { setPwError("Passwords do not match."); return; }

    setPwLoading(true);
    try {
      await api.postNoRedirect<MessageResponse>("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      setPwSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setPwLoading(false);
    }
  }

  async function handleRevokeSession(id: number, isCurrent: boolean) {
    try {
      await api.delete(`/auth/sessions/${id}`);
      if (isCurrent) {
        await fetch("/api/clear-auth-cookie", { method: "POST" });
        router.push("/login");
        return;
      }
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to revoke session");
    }
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
              className="border border-zinc-300 rounded px-3 py-2 text-sm outline-none focus:border-black"
            />
            <p className="text-xs text-zinc-400">
              Min 8 chars — uppercase, lowercase, number, special character.
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="border border-zinc-300 rounded px-3 py-2 text-sm outline-none focus:border-black"
            />
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
        {sessions.length === 0 && (
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
                  Signed in {formatDate(s.createdAt)}
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
