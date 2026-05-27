import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const BASE = process.env.BACKEND_URL ?? "http://localhost:5281";

export async function serverFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = (await cookies()).get("auth-token")?.value;
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (res.status === 401) redirect("/api/auth-expired");

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `HTTP ${res.status}`);
  }

  if (res.status === 204) return null as T;
  return res.json() as Promise<T>;
}
