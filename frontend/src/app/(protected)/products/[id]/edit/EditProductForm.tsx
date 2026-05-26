"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Product, AiDescriptionResponse } from "@/lib/types";

export default function EditProductForm({ product }: { product: Product }) {
  const router = useRouter();
  const [name, setName] = useState(product.name);
  const [category, setCategory] = useState(product.category);
  const [price, setPrice] = useState(String(product.price));
  const [inventory, setInventory] = useState(String(product.inventory));
  const [description, setDescription] = useState(product.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  async function generateDescription() {
    if (!name || !category) {
      setError("Name and category are required to generate a description.");
      return;
    }
    setAiLoading(true);
    setError(null);
    try {
      const res = await api.post<AiDescriptionResponse>("/ai/description", {
        productName: name,
        category,
      });
      setDescription(res.description);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI generation failed");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.put<Product>(`/products/${product.id}`, {
        name,
        category,
        price: parseFloat(price),
        inventory: parseInt(inventory),
        description: description || null,
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update product");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold mb-6">Edit Product</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="border border-zinc-300 rounded px-3 py-2 text-sm outline-none focus:border-black"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Category</label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className="border border-zinc-300 rounded px-3 py-2 text-sm outline-none focus:border-black"
          />
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-sm font-medium">Price ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              className="border border-zinc-300 rounded px-3 py-2 text-sm outline-none focus:border-black"
            />
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-sm font-medium">Inventory</label>
            <input
              type="number"
              min="0"
              value={inventory}
              onChange={(e) => setInventory(e.target.value)}
              required
              className="border border-zinc-300 rounded px-3 py-2 text-sm outline-none focus:border-black"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Description</label>
            <button
              type="button"
              onClick={generateDescription}
              disabled={aiLoading}
              className="text-xs text-zinc-500 hover:text-black border border-zinc-300 rounded px-2 py-1 disabled:opacity-50"
            >
              {aiLoading ? "Generating…" : "✨ Generate with AI"}
            </button>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="border border-zinc-300 rounded px-3 py-2 text-sm outline-none focus:border-black resize-none"
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white rounded px-4 py-2 text-sm font-medium hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading ? "Saving…" : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="border border-zinc-300 rounded px-4 py-2 text-sm font-medium hover:bg-zinc-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
