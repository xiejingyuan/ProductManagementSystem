"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Product, ProductImage, AiDescriptionResponse } from "@/lib/types";

type VariantForm = { name: string; price: string; inventory: string; sku: string };

export default function NewProductPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [inventory, setInventory] = useState("");
  const [description, setDescription] = useState("");
  const [variants, setVariants] = useState<VariantForm[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  async function generateDescription() {
    if (!name || !category) {
      setError("Enter a name and category before generating a description.");
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

  function addVariant() {
    setVariants((v) => [...v, { name: "", price: "", inventory: "0", sku: "" }]);
  }

  function removeVariant(i: number) {
    setVariants((v) => v.filter((_, idx) => idx !== i));
  }

  function updateVariant(i: number, field: keyof VariantForm, value: string) {
    setVariants((v) =>
      v.map((item, idx) => (idx === i ? { ...item, [field]: value } : item))
    );
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setImageFiles((prev) => [...prev, ...files]);
    setImagePreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    e.target.value = "";
  }

  function removeImageFile(i: number) {
    URL.revokeObjectURL(imagePreviews[i]);
    setImageFiles((prev) => prev.filter((_, idx) => idx !== i));
    setImagePreviews((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const product = await api.post<Product>("/products", {
        name,
        category,
        price: parseFloat(price),
        inventory: parseInt(inventory),
        description: description || null,
        variants: variants.map((v) => ({
          name: v.name,
          price: v.price ? parseFloat(v.price) : null,
          inventory: parseInt(v.inventory) || 0,
          sku: v.sku || null,
        })),
      });

      for (const file of imageFiles) {
        const formData = new FormData();
        formData.append("file", file);
        await api.upload<ProductImage>(`/product-images/${product.id}`, formData);
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create product");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold mb-6">New Product</h1>
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

        {/* Variants */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Variants</label>
            <button
              type="button"
              onClick={addVariant}
              className="text-xs border border-zinc-300 rounded px-2 py-1 hover:bg-zinc-50"
            >
              + Add Variant
            </button>
          </div>
          {variants.length === 0 && (
            <p className="text-xs text-zinc-400">
              No variants — base price and inventory apply to the whole product.
            </p>
          )}
          {variants.map((v, i) => (
            <div key={i} className="border border-zinc-200 rounded p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">Variant {i + 1}</span>
                <button
                  type="button"
                  onClick={() => removeVariant(i)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
              <input
                placeholder="Name (e.g. Red / Large)"
                value={v.name}
                onChange={(e) => updateVariant(i, "name", e.target.value)}
                required
                className="border border-zinc-300 rounded px-3 py-2 text-sm outline-none focus:border-black"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Price override (optional)"
                  value={v.price}
                  onChange={(e) => updateVariant(i, "price", e.target.value)}
                  className="border border-zinc-300 rounded px-3 py-2 text-sm outline-none focus:border-black flex-1"
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Inventory"
                  value={v.inventory}
                  onChange={(e) => updateVariant(i, "inventory", e.target.value)}
                  required
                  className="border border-zinc-300 rounded px-3 py-2 text-sm outline-none focus:border-black flex-1"
                />
              </div>
              <input
                placeholder="SKU (optional)"
                value={v.sku}
                onChange={(e) => updateVariant(i, "sku", e.target.value)}
                className="border border-zinc-300 rounded px-3 py-2 text-sm outline-none focus:border-black"
              />
            </div>
          ))}
        </div>

        {/* Images */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Images</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/ogg,video/quicktime"
            multiple
            onChange={handleImageSelect}
            className="text-sm text-zinc-500 file:mr-3 file:border file:border-zinc-300 file:rounded file:px-2 file:py-1 file:text-xs file:bg-white file:hover:bg-zinc-50 file:cursor-pointer"
          />
          {imagePreviews.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {imagePreviews.map((src, i) => (
                <div key={i} className="relative">
                  {imageFiles[i].type.startsWith("video/") ? (
                    <video
                      src={src}
                      className="w-20 h-20 object-cover rounded border border-zinc-200"
                      muted
                    />
                  ) : (
                    <img
                      src={src}
                      alt=""
                      className="w-20 h-20 object-cover rounded border border-zinc-200"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => removeImageFile(i)}
                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white rounded px-4 py-2 text-sm font-medium hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create Product"}
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
