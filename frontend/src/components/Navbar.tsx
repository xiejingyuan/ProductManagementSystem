"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { logout as logoutApi } from "@/lib/api";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  async function logout() {
    await logoutApi();
    router.push("/login");
  }

  const linkClass = (href: string) =>
    `text-sm font-medium transition-colors hover:text-black ${
      pathname === href ? "text-black" : "text-zinc-500"
    }`;

  return (
    <nav className="border-b border-zinc-200 bg-white px-6 py-3 flex items-center justify-between">
      <Link href="/dashboard" className="font-semibold text-base">
        Product Manager
      </Link>
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className={linkClass("/dashboard")}>
          Products
        </Link>
        <Link href="/products/new" className={linkClass("/products/new")}>
          New Product
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
