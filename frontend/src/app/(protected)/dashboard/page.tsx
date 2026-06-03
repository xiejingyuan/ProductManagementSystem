import { serverFetch } from "@/lib/server-api";
import type { Product } from "@/lib/types";

export default async function DashboardPage() {
  const products = await serverFetch<Product[]>("/api/products");

  const total = products.length;
  const active = products.filter(p => p.inventory > 0).length;
  const outOfStock = products.filter(p => p.inventory === 0).length;

  const categoryMap: Record<string, number> = {};
  for (const p of products) {
    categoryMap[p.category] = (categoryMap[p.category] ?? 0) + 1;
  }
  const categories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);

  const recent = [...products]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* Summary */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Summary</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Products", value: total },
            { label: "Active Products", value: active },
            { label: "Out of Stock", value: outOfStock },
          ].map(({ label, value }) => (
            <div key={label} className="border border-zinc-200 rounded-lg p-5 bg-white">
              <p className="text-sm text-zinc-500">{label}</p>
              <p className="text-3xl font-semibold mt-1">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-6">
        {/* Products by Category */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Products by Category</h2>
          <div className="border border-zinc-200 rounded-lg bg-white divide-y divide-zinc-100">
            {categories.length === 0 ? (
              <p className="text-sm text-zinc-400 px-4 py-3">No products yet.</p>
            ) : categories.map(([cat, count]) => (
              <div key={cat} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm">{cat}</span>
                <span className="text-sm font-medium tabular-nums">{count}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Recently Added */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Recently Added</h2>
          <div className="border border-zinc-200 rounded-lg bg-white divide-y divide-zinc-100">
            {recent.length === 0 ? (
              <p className="text-sm text-zinc-400 px-4 py-3">No products yet.</p>
            ) : recent.map(p => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-medium">{p.name}</span>
                <span className="text-xs text-zinc-400 tabular-nums">
                  {new Date(p.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
