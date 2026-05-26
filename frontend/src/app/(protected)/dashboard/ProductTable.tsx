"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Product } from "@/lib/types";

export default function ProductTable({ products: initial }: { products: Product[] }) {
  const [products, setProducts] = useState(initial);

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
                <Link
                  href={`/products/${p.id}/edit`}
                  className="text-zinc-500 hover:text-black transition-colors"
                >
                  Edit
                </Link>
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
  );
}
