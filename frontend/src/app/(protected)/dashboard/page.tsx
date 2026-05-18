"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Product } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Product[]>("/products")
      .then(setProducts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: number) {
    if (!confirm("Delete this product?")) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Link
          href="/products/new"
          className="bg-black text-white text-sm font-medium px-4 py-2 rounded hover:bg-zinc-800"
        >
          + New Product
        </Link>
      </div>

      {loading && <p className="text-zinc-400 text-sm">Loading…</p>}
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {!loading && !error && products.length === 0 && (
        <p className="text-zinc-400 text-sm">No products yet. Create your first one.</p>
      )}

      {products.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-zinc-500">
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Category</th>
                <th className="py-2 pr-4 font-medium">Price</th>
                <th className="py-2 pr-4 font-medium">Inventory</th>
                <th className="py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-zinc-100 hover:bg-white">
                  <td className="py-3 pr-4 font-medium">{p.name}</td>
                  <td className="py-3 pr-4 text-zinc-500">{p.category}</td>
                  <td className="py-3 pr-4">${p.price.toFixed(2)}</td>
                  <td className="py-3 pr-4">{p.inventory}</td>
                  <td className="py-3 flex gap-3">
                    <button
                      onClick={() => router.push(`/products/${p.id}/edit`)}
                      className="text-zinc-500 hover:text-black transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
