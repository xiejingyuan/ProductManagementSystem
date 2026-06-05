"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, uploadToCloudinary } from "@/lib/api";
import type { Product, ProductImage, AiDescriptionResponse } from "@/lib/types";

const MAX_FILE_SIZE = 50 * 1024 * 1024;   // 50 MB per file
const MAX_GALLERY_SIZE = 200 * 1024 * 1024; // 200 MB total batch

export default function EditProductForm({ product }: { product: Product }) {
  const router = useRouter();

  const [name, setName] = useState(product.name);
  const [category, setCategory] = useState(product.category);
  const [price, setPrice] = useState(String(product.price));
  const [inventory, setInventory] = useState(String(product.inventory));
  const [description, setDescription] = useState(product.description ?? "");

  const [existingMainImage, setExistingMainImage] = useState<ProductImage | null>(
    product.images.find(img => img.isMain) ?? product.images[0] ?? null
  );
  const [existingGallery, setExistingGallery] = useState(
    product.images.filter(img => !img.isMain)
  );
  // IDs of existing images to delete on submit — no API calls until save
  const [imageIdsToDelete, setImageIdsToDelete] = useState<number[]>([]);

  const [newMainFile, setNewMainFile] = useState<File | null>(null);
  const [newMainPreview, setNewMainPreview] = useState<string | null>(null);
  const [newGalleryFiles, setNewGalleryFiles] = useState<File[]>([]);
  const [newGalleryPreviews, setNewGalleryPreviews] = useState<string[]>([]);

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
      const res = await api.post<AiDescriptionResponse>("/ai/description", { productName: name, category });
      setDescription(res.description);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI generation failed");
    } finally {
      setAiLoading(false);
    }
  }

  // Mark for deletion — no API call yet
  function markMainImageForDeletion() {
    if (!existingMainImage) return;
    setImageIdsToDelete(prev => [...prev, existingMainImage.id]);
    setExistingMainImage(null);
  }

  function markGalleryImageForDeletion(id: number) {
    setImageIdsToDelete(prev => [...prev, id]);
    setExistingGallery(imgs => imgs.filter(img => img.id !== id));
  }

  function handleNewMainSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setError(`"${file.name}" exceeds the 10 MB limit.`);
      return;
    }
    if (newMainPreview) URL.revokeObjectURL(newMainPreview);
    setNewMainFile(file);
    setNewMainPreview(URL.createObjectURL(file));
    setError(null);
  }

  function removeNewMainFile() {
    if (newMainPreview) URL.revokeObjectURL(newMainPreview);
    setNewMainFile(null);
    setNewMainPreview(null);
  }

  function handleNewGallerySelect(e: React.ChangeEvent<HTMLInputElement>) {
    const all = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!all.length) return;

    const oversized = all.filter(f => f.size > MAX_FILE_SIZE);
    const valid = all.filter(f => f.size <= MAX_FILE_SIZE);
    const errors: string[] = [];

    if (oversized.length)
      errors.push(`${oversized.map(f => `"${f.name}"`).join(", ")} exceed${oversized.length === 1 ? "s" : ""} the 50 MB limit and were skipped.`);

    if (valid.length) {
      const currentTotal = newGalleryFiles.reduce((sum, f) => sum + f.size, 0);
      const addingTotal = valid.reduce((sum, f) => sum + f.size, 0);
      if (currentTotal + addingTotal > MAX_GALLERY_SIZE) {
        errors.push("Adding these files would exceed the 200 MB total gallery limit.");
        setError(errors.join(" "));
        return;
      }
      setNewGalleryFiles(prev => [...prev, ...valid]);
      setNewGalleryPreviews(prev => [...prev, ...valid.map(f => URL.createObjectURL(f))]);
    }

    setError(errors.length ? errors.join(" ") : null);
  }

  function removeNewGalleryFile(i: number) {
    URL.revokeObjectURL(newGalleryPreviews[i]);
    setNewGalleryFiles(prev => prev.filter((_, idx) => idx !== i));
    setNewGalleryPreviews(prev => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!existingMainImage && !newMainFile) {
      setError("A main image is required.");
      return;
    }
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

      // Delete images marked for removal
      for (const id of imageIdsToDelete) {
        await api.delete(`/product-images/${id}`);
      }

      if (newMainFile || newGalleryFiles.length > 0) {
        const sig = await api.getUploadSignature();

        if (newMainFile) {
          const mainResult = await uploadToCloudinary(newMainFile, sig);
          await api.post<ProductImage>(`/product-images/${product.id}`, {
            url: mainResult.secure_url,
            publicId: mainResult.public_id,
            resourceType: mainResult.resource_type,
            isMain: true,
          });
        }

        if (newGalleryFiles.length > 0) {
          const successful: { url: string; publicId: string; resourceType: string }[] = [];
          const failed: string[] = [];

          for (const file of newGalleryFiles) {
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
            setError(`Some gallery files failed to upload: ${failed.join(", ")}. Try adding them again.`);
            return;
          }
        }
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update product");
    } finally {
      setLoading(false);
    }
  }

  function MediaThumb({ url, resourceType, className }: { url: string; resourceType: string; className: string }) {
    return resourceType === "video"
      ? <video src={url} className={className} muted />
      : <img src={url} alt="" className={className} />;
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold mb-6">Edit Product</h1>
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
          {existingMainImage && !newMainFile && (
            <div className="relative w-fit">
              <MediaThumb url={existingMainImage.url} resourceType={existingMainImage.resourceType}
                className="w-32 h-32 object-cover rounded border border-zinc-200" />
              <button type="button" onClick={markMainImageForDeletion}
                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-600">
                ×
              </button>
            </div>
          )}
          {newMainFile && newMainPreview && (
            <div className="relative w-fit">
              <MediaThumb url={newMainPreview} resourceType={newMainFile.type.startsWith("video/") ? "video" : "image"}
                className="w-32 h-32 object-cover rounded border border-zinc-200" />
              <button type="button" onClick={removeNewMainFile}
                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-600">
                ×
              </button>
            </div>
          )}
          <input type="file" accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/ogg,video/quicktime"
            onChange={handleNewMainSelect}
            className="text-sm text-zinc-500 file:mr-3 file:border file:border-zinc-300 file:rounded file:px-2 file:py-1 file:text-xs file:bg-white file:hover:bg-zinc-50 file:cursor-pointer" />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Gallery
            <span className="text-zinc-400 font-normal ml-1">(optional · images &amp; videos · max 50 MB each)</span>
          </label>
          {(existingGallery.length > 0 || newGalleryPreviews.length > 0) && (
            <div className="flex flex-wrap gap-2">
              {existingGallery.map(img => (
                <div key={img.id} className="relative">
                  <MediaThumb url={img.url} resourceType={img.resourceType}
                    className="w-20 h-20 object-cover rounded border border-zinc-200" />
                  <button type="button" onClick={() => markGalleryImageForDeletion(img.id)}
                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-600">
                    ×
                  </button>
                </div>
              ))}
              {newGalleryPreviews.map((src, i) => (
                <div key={`new-${i}`} className="relative">
                  <MediaThumb url={src} resourceType={newGalleryFiles[i].type.startsWith("video/") ? "video" : "image"}
                    className="w-20 h-20 object-cover rounded border border-zinc-200 opacity-75" />
                  <button type="button" onClick={() => removeNewGalleryFile(i)}
                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-600">
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <input type="file" accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/ogg,video/quicktime"
            multiple onChange={handleNewGallerySelect}
            className="text-sm text-zinc-500 file:mr-3 file:border file:border-zinc-300 file:rounded file:px-2 file:py-1 file:text-xs file:bg-white file:hover:bg-zinc-50 file:cursor-pointer" />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={loading}
            className="bg-black text-white rounded px-4 py-2 text-sm font-medium hover:bg-zinc-800 disabled:opacity-50">
            {loading ? "Saving…" : "Save Changes"}
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
