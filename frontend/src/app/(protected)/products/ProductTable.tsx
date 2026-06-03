"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Product } from "@/lib/types";

type SortCol = "category" | "status";
type SortDir = "asc" | "desc";

function getStatus(product: Product) {
  return product.inventory > 0 ? "Active" : "Out of Stock";
}

export default function ProductTable({ products: initial }: { products: Product[] }) {
  const [products, setProducts] = useState(initial);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortCol | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function toggleSort(col: SortCol) {
    if (sortBy === col) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortBy(col);
      setSortDir("asc");
    }
  }

  function SortIcon({ col }: { col: SortCol }) {
    if (sortBy !== col) return <span className="text-zinc-300 ml-1">↕</span>;
    return <span className="text-black ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  const displayed = products
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (!sortBy) return 0;
      const av = sortBy === "category" ? a.category : getStatus(a);
      const bv = sortBy === "category" ? b.category : getStatus(b);
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });

  async function handleDelete(id: number) {
    if (!confirm("Delete this product?")) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <input
        type="text"
        placeholder="Search by name…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full max-w-sm border border-zinc-300 rounded px-3 py-2 text-sm outline-none focus:border-black"
      />

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
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
            {displayed.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-zinc-400 text-sm">
                  {search ? "No products match your search." : "No products yet. Create your first one."}
                </td>
              </tr>
            ) : displayed.map(p => {
              const mainImage = p.images.find(img => img.isMain) ?? p.images[0];
              const status = getStatus(p);
              return (
                <tr key={p.id} className="border-b border-zinc-100 hover:bg-white">
                  <td className="py-3 pr-4">
                    {mainImage ? (
                      mainImage.resourceType === "video" ? (
                        <video src={mainImage.url} className="w-10 h-10 object-cover rounded border border-zinc-200" muted />
                      ) : (
                        <img src={mainImage.url} alt={p.name} className="w-10 h-10 object-cover rounded border border-zinc-200" />
                      )
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
                      status === "Active"
                        ? "bg-green-100 text-green-700"
                        : "bg-zinc-100 text-zinc-500"
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
    </div>
  );
}
