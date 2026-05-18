"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { hasToken } from "@/lib/api";
import Navbar from "@/components/Navbar";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!hasToken()) {
      router.replace("/login");
    } else {
      setChecked(true);
    }
  }, [router]);

  if (!checked) return null;

  return (
    <div className="flex flex-col min-h-full">
      <Navbar />
      <main className="flex-1 bg-zinc-50">{children}</main>
    </div>
  );
}
