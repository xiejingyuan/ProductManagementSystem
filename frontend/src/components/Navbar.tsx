"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout as logoutApi } from "@/lib/api";

export default function Navbar() {
  const pathname = usePathname();

  async function logout() {
    await logoutApi();
    window.location.href = "/login";
  }

  const linkClass = (href: string, exact = true) =>
    `text-sm font-medium transition-colors hover:text-black ${
      (exact ? pathname === href : pathname.startsWith(href))
        ? "text-black"
        : "text-zinc-500"
    }`;

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-200 bg-white px-6 py-3 flex items-center justify-between">
      <Link href="/dashboard" className="font-semibold text-base">
        Product Manager
      </Link>
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className={linkClass("/dashboard")}>
          Dashboard
        </Link>
        <Link href="/products" className={linkClass("/products", false)}>
          Products
        </Link>
        <Link href="/account" className={linkClass("/account")}>
          Account
        </Link>
        <button
          onClick={logout}
          className="text-sm font-medium text-zinc-500 hover:text-black transition-colors"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
