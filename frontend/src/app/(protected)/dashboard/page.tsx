import { serverFetch } from "@/lib/server-api";
import type { DashboardStats } from "@/lib/types";

export default async function DashboardPage() {
  const stats = await serverFetch<DashboardStats>("/api/products/stats");

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Summary</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Products", value: stats.total },
            { label: "Active Products", value: stats.active },
            { label: "Out of Stock",    value: stats.outOfStock },
          ].map(({ label, value }) => (
            <div key={label} className="border border-zinc-200 rounded-lg p-5 bg-white">
              <p className="text-sm text-zinc-500">{label}</p>
              <p className="text-3xl font-semibold mt-1">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-6">
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Products by Category</h2>
          <div className="border border-zinc-200 rounded-lg bg-white divide-y divide-zinc-100">
            {stats.byCategory.length === 0 ? (
              <p className="text-sm text-zinc-400 px-4 py-3">No products yet.</p>
            ) : stats.byCategory.map(({ category, count }) => (
              <div key={category} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm">{category}</span>
                <span className="text-sm font-medium tabular-nums">{count}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Recently Added</h2>
          <div className="border border-zinc-200 rounded-lg bg-white divide-y divide-zinc-100">
            {stats.recentlyAdded.length === 0 ? (
              <p className="text-sm text-zinc-400 px-4 py-3">No products yet.</p>
            ) : stats.recentlyAdded.map(p => (
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
