"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Product } from "@/lib/types";

type SortCol = "category" | "status";

function getStatus(p: Product) {
  return p.inventory > 0 ? "Active" : "Out of Stock";
}

interface Props {
  items: Product[];
  totalCount: number;
  page: number;
  pageSize: number;
  search: string;
  sortBy: string;
  sortDir: "asc" | "desc";
}

export default function ProductTable({ items, totalCount, page, pageSize, search: initialSearch, sortBy, sortDir }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState(items);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const totalPages = Math.ceil(totalCount / pageSize);

  useEffect(() => { setProducts(items); }, [items]);

  function navigate(updates: { page?: number; search?: string; sortBy?: string; sortDir?: string }) {
    const params = new URLSearchParams(searchParams.toString());

    if ("search" in updates) {
      updates.search ? params.set("search", updates.search) : params.delete("search");
      params.delete("page");
    }
    if ("sortBy" in updates) {
      updates.sortBy ? params.set("sortBy", updates.sortBy) : params.delete("sortBy");
      params.delete("page");
    }
    if ("sortDir" in updates) {
      updates.sortDir && updates.sortDir !== "asc"
        ? params.set("sortDir", updates.sortDir)
        : params.delete("sortDir");
    }
    if ("page" in updates) {
      (updates.page ?? 1) > 1
        ? params.set("page", String(updates.page))
        : params.delete("page");
    }

    router.replace(`/products?${params.toString()}`);
  }

  // Debounced search — only fires when input differs from current URL param
  useEffect(() => {
    const urlSearch = searchParams.get("search") ?? "";
    if (searchInput === urlSearch) return;
    const timer = setTimeout(() => navigate({ search: searchInput }), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  function toggleSort(col: SortCol) {
    const newDir = sortBy === col && sortDir === "asc" ? "desc" : "asc";
    navigate({ sortBy: col, sortDir: newDir });
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this product?")) return;
    try {
      await api.delete(`/products/${id}`);
      const remaining = products.filter(p => p.id !== id);
      if (remaining.length === 0 && page > 1) {
        navigate({ page: page - 1 });
      } else {
        setProducts(remaining);
        router.refresh();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  }

  function SortIcon({ col }: { col: SortCol }) {
    if (sortBy !== col) return <span className="text-zinc-300 ml-1">↕</span>;
    return <span className="text-black ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
    .reduce<(number | "…")[]>((acc, n, i, arr) => {
      if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push("…");
      acc.push(n);
      return acc;
    }, []);

  return (
    <div className="flex flex-col gap-4">
      <input
        type="text"
        placeholder="Search by name…"
        value={searchInput}
        onChange={e => setSearchInput(e.target.value)}
        className="w-full max-w-sm border border-zinc-300 rounded px-3 py-2 text-sm outline-none focus:border-black"
      />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-zinc-500">
              <th className="py-2 pr-4 font-medium w-12"></th>
              <th className="py-2 pr-4 font-medium">Name</th>
              <th className="py-2 pr-4 font-medium">
                <button onClick={() => toggleSort("category")} className="flex items-center hover:text-black">
                  Category <SortIcon col="category" />
                </button>
              </th>
              <th className="py-2 pr-4 font-medium">Price</th>
              <th className="py-2 pr-4 font-medium">Inventory</th>
              <th className="py-2 pr-4 font-medium">
                <button onClick={() => toggleSort("status")} className="flex items-center hover:text-black">
                  Status <SortIcon col="status" />
                </button>
              </th>
              <th className="py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-zinc-400 text-sm">
                  {searchInput ? "No products match your search." : "No products yet. Create your first one."}
                </td>
              </tr>
            ) : products.map(p => {
              const mainImage = p.images.find(img => img.isMain) ?? p.images[0];
              const status = getStatus(p);
              return (
                <tr key={p.id} className="border-b border-zinc-100 hover:bg-white">
                  <td className="py-3 pr-4">
                    {mainImage ? (
                      mainImage.resourceType === "video"
                        ? <video src={mainImage.url} className="w-10 h-10 object-cover rounded border border-zinc-200" muted />
                        : <img src={mainImage.url} alt={p.name} className="w-10 h-10 object-cover rounded border border-zinc-200" />
                    ) : (
                      <div className="w-10 h-10 rounded border border-zinc-200 bg-zinc-100" />
                    )}
                  </td>
                  <td className="py-3 pr-4 font-medium">{p.name}</td>
                  <td className="py-3 pr-4 text-zinc-500">{p.category}</td>
                  <td className="py-3 pr-4">${p.price.toFixed(2)}</td>
                  <td className="py-3 pr-4">{p.inventory}</td>
                  <td className="py-3 pr-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      status === "Active" ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"
                    }`}>
                      {status}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex gap-3">
                      <Link href={`/products/${p.id}/edit`} className="text-zinc-500 hover:text-black transition-colors">
                        Edit
                      </Link>
                      <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700 transition-colors">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm pt-2">
          <span className="text-zinc-400 tabular-nums">
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} of {totalCount}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate({ page: page - 1 })}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-600"
            >
              ←
            </button>
            {pageNumbers.map((n, i) =>
              n === "…" ? (
                <span key={`ellipsis-${i}`} className="px-2 text-zinc-400">…</span>
              ) : (
                <button
                  key={n}
                  onClick={() => navigate({ page: n as number })}
                  className={`px-3 py-1.5 rounded border text-sm ${
                    page === n
                      ? "border-black bg-black text-white"
                      : "border-zinc-200 hover:bg-zinc-50 text-zinc-600"
                  }`}
                >
                  {n}
                </button>
              )
            )}
            <button
              onClick={() => navigate({ page: page + 1 })}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-600"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
