import Link from "next/link";
import type { Product } from "@/lib/types";
import { serverFetch } from "@/lib/server-api";
import ProductTable from "./ProductTable";

export default async function ProductsPage() {
  const products = await serverFetch<Product[]>("/api/products");

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
      <ProductTable products={products} />
    </div>
  );
}
