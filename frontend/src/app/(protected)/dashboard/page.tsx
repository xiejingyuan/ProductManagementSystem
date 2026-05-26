import Link from "next/link";
import { cookies } from "next/headers";
import type { Product } from "@/lib/types";
import ProductTable from "./ProductTable";

export default async function DashboardPage() {
  const token = (await cookies()).get("auth-token")?.value;
  const res = await fetch(
    `${process.env.BACKEND_URL ?? "http://localhost:5281"}/api/products`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error("Failed to load products");
  const products: Product[] = await res.json();

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
      {products.length === 0 ? (
        <p className="text-zinc-400 text-sm">No products yet. Create your first one.</p>
      ) : (
        <ProductTable products={products} />
      )}
    </div>
  );
}
