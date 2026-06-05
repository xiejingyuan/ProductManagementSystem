"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, uploadToCloudinary } from "@/lib/api";
import type { Product, ProductImage, AiDescriptionResponse } from "@/lib/types";

const MAX_FILE_SIZE = 50 * 1024 * 1024;   // 50 MB per file
const MAX_GALLERY_SIZE = 200 * 1024 * 1024; // 200 MB total batch

export default function NewProductPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [inventory, setInventory] = useState("");
  const [description, setDescription] = useState("");

  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

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
      const res = await api.post<AiDescriptionResponse>("/ai/description", { productName: name, category });
      setDescription(res.description);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI generation failed");
    } finally {
      setAiLoading(false);
    }
  }

  function handleMainImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setError(`"${file.name}" exceeds the 10 MB limit.`);
      return;
    }
    if (mainImagePreview) URL.revokeObjectURL(mainImagePreview);
    setMainImageFile(file);
    setMainImagePreview(URL.createObjectURL(file));
    setError(null);
  }

  function removeMainImage() {
    if (mainImagePreview) URL.revokeObjectURL(mainImagePreview);
    setMainImageFile(null);
    setMainImagePreview(null);
  }

  function handleGallerySelect(e: React.ChangeEvent<HTMLInputElement>) {
    const all = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!all.length) return;

    const oversized = all.filter(f => f.size > MAX_FILE_SIZE);
    const valid = all.filter(f => f.size <= MAX_FILE_SIZE);
    const errors: string[] = [];

    if (oversized.length)
      errors.push(`${oversized.map(f => `"${f.name}"`).join(", ")} exceed${oversized.length === 1 ? "s" : ""} the 50 MB limit and were skipped.`);

    if (valid.length) {
      const currentTotal = galleryFiles.reduce((sum, f) => sum + f.size, 0);
      const addingTotal = valid.reduce((sum, f) => sum + f.size, 0);
      if (currentTotal + addingTotal > MAX_GALLERY_SIZE) {
        errors.push("Adding these files would exceed the 200 MB total gallery limit.");
        setError(errors.join(" "));
        return;
      }
      setGalleryFiles(prev => [...prev, ...valid]);
      setGalleryPreviews(prev => [...prev, ...valid.map(f => URL.createObjectURL(f))]);
    }

    setError(errors.length ? errors.join(" ") : null);
  }

  function removeGalleryFile(i: number) {
    URL.revokeObjectURL(galleryPreviews[i]);
    setGalleryFiles(prev => prev.filter((_, idx) => idx !== i));
    setGalleryPreviews(prev => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!mainImageFile) {
      setError("A main image is required.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const product = await api.post<Product>("/products", {
        name,
        category,
        price: parseFloat(price),
        inventory: parseInt(inventory),
        description: description || null,
      });

      const sig = await api.getUploadSignature();

      const mainResult = await uploadToCloudinary(mainImageFile, sig);
      await api.post<ProductImage>(`/product-images/${product.id}`, {
        url: mainResult.secure_url,
        publicId: mainResult.public_id,
        resourceType: mainResult.resource_type,
        isMain: true,
      });

      if (galleryFiles.length > 0) {
        const successful: { url: string; publicId: string; resourceType: string }[] = [];
        const failed: string[] = [];

        for (const file of galleryFiles) {
          try {
            const r = await uploadToCloudinary(file, sig);
            successful.push({ url: r.secure_url, publicId: r.public_id, resourceType: r.resource_type });
          } catch {
            failed.push(file.name);
          }
        }

        if (successful.length > 0) {
          await api.post(`/product-images/${product.id}/batch`, successful);
        }

        if (failed.length > 0) {
          setError(`Some gallery files failed to upload: ${failed.join(", ")}. Add them again from the edit page.`);
          router.push(`/products/${product.id}/edit`);
          return;
        }
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
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Name</label>
          <input value={name} onChange={e => setName(e.target.value)} required
            className="border border-zinc-300 rounded px-3 py-2 text-sm outline-none focus:border-black" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Category</label>
          <input value={category} onChange={e => setCategory(e.target.value)} required
            className="border border-zinc-300 rounded px-3 py-2 text-sm outline-none focus:border-black" />
        </div>

        <div className="flex gap-4">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-sm font-medium">Price ($)</label>
            <input type="number" min="0" step="0.01" value={price}
              onChange={e => setPrice(e.target.value)}
              onKeyDown={e => ['-', '+', 'e'].includes(e.key) && e.preventDefault()}
              required
              className="border border-zinc-300 rounded px-3 py-2 text-sm outline-none focus:border-black" />
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-sm font-medium">Inventory</label>
            <input type="number" min="0" step="1" value={inventory}
              onChange={e => setInventory(e.target.value)}
              onKeyDown={e => ['-', '+', 'e', '.'].includes(e.key) && e.preventDefault()}
              required
              className="border border-zinc-300 rounded px-3 py-2 text-sm outline-none focus:border-black" />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Description</label>
            <button type="button" onClick={generateDescription} disabled={aiLoading}
              className="text-xs text-zinc-500 hover:text-black border border-zinc-300 rounded px-2 py-1 disabled:opacity-50">
              {aiLoading ? "Generating…" : "✨ Generate with AI"}
            </button>
          </div>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
            className="border border-zinc-300 rounded px-3 py-2 text-sm outline-none focus:border-black resize-none" />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Main Image <span className="text-red-500">*</span>
            <span className="text-zinc-400 font-normal ml-1">(max 50 MB)</span>
          </label>
          {mainImagePreview ? (
            <div className="relative w-fit">
              {mainImageFile?.type.startsWith("video/") ? (
                <video src={mainImagePreview} className="w-32 h-32 object-cover rounded border border-zinc-200" muted />
              ) : (
                <img src={mainImagePreview} alt="" className="w-32 h-32 object-cover rounded border border-zinc-200" />
              )}
              <button type="button" onClick={removeMainImage}
                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-600">
                ×
              </button>
            </div>
          ) : (
            <input type="file" accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/ogg,video/quicktime"
              onChange={handleMainImageSelect}
              className="text-sm text-zinc-500 file:mr-3 file:border file:border-zinc-300 file:rounded file:px-2 file:py-1 file:text-xs file:bg-white file:hover:bg-zinc-50 file:cursor-pointer" />
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Gallery
            <span className="text-zinc-400 font-normal ml-1">(optional · images &amp; videos · max 50 MB each)</span>
          </label>
          <input type="file" accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/ogg,video/quicktime"
            multiple onChange={handleGallerySelect}
            className="text-sm text-zinc-500 file:mr-3 file:border file:border-zinc-300 file:rounded file:px-2 file:py-1 file:text-xs file:bg-white file:hover:bg-zinc-50 file:cursor-pointer" />
          {galleryPreviews.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {galleryPreviews.map((src, i) => (
                <div key={i} className="relative">
                  {galleryFiles[i].type.startsWith("video/") ? (
                    <video src={src} className="w-20 h-20 object-cover rounded border border-zinc-200" muted />
                  ) : (
                    <img src={src} alt="" className="w-20 h-20 object-cover rounded border border-zinc-200" />
                  )}
                  <button type="button" onClick={() => removeGalleryFile(i)}
                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-600">
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={loading}
            className="bg-black text-white rounded px-4 py-2 text-sm font-medium hover:bg-zinc-800 disabled:opacity-50">
            {loading ? "Creating…" : "Create Product"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="border border-zinc-300 rounded px-4 py-2 text-sm font-medium hover:bg-zinc-50">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
