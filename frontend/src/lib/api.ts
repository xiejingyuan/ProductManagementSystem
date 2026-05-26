const BASE = "/api";

async function request<T>(
  path: string,
  options: RequestInit = {},
  redirectOn401 = true,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (res.status === 401) {
    if (redirectOn401 && typeof window !== "undefined") {
      fetch("/api/clear-auth-cookie", { method: "POST" }).finally(() => {
        window.location.href = "/login";
      });
    }
    throw new Error("Invalid email or password.");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message =
      body?.message ??
      (body?.errors
        ? Object.values(body.errors as Record<string, string[]>).flat()[0]
        : undefined) ??
      body?.title ??
      `HTTP ${res.status}`;
    throw new Error(message);
  }

  if (res.status === 204) return null as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: (path: string) => request<void>(path, { method: "DELETE" }),
  postNoRedirect: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }, false),
};

export async function saveToken(token: string): Promise<void> {
  await fetch("/api/set-auth-cookie", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
}

export async function logout(): Promise<void> {
  try {
    await api.post<void>("/auth/logout", {});
  } finally {
    await fetch("/api/clear-auth-cookie", { method: "POST" });
  }
}
