import { Suspense } from "react";
import Link from "next/link";
import type { Product, PagedResult } from "@/lib/types";
import { serverFetch } from "@/lib/server-api";
import ProductTable from "./ProductTable";

const PAGE_SIZE = 10;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; sortBy?: string; sortDir?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1") || 1);
  const search = params.search ?? "";
  const sortBy = params.sortBy ?? "";
  const sortDir = (params.sortDir ?? "asc") as "asc" | "desc";

  const query = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
  if (search) query.set("search", search);
  if (sortBy) query.set("sortBy", sortBy);
  if (sortDir !== "asc") query.set("sortDir", sortDir);

  const result = await serverFetch<PagedResult<Product>>(`/api/products?${query}`);

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
      <Suspense>
        <ProductTable
          items={result.items}
          totalCount={result.totalCount}
          page={page}
          pageSize={PAGE_SIZE}
          search={search}
          sortBy={sortBy}
          sortDir={sortDir}
        />
      </Suspense>
    </div>
  );
}
