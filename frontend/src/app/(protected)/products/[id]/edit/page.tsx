import { cookies } from "next/headers";
import type { Product } from "@/lib/types";
import EditProductForm from "./EditProductForm";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const token = (await cookies()).get("auth-token")?.value;
  const res = await fetch(
    `${process.env.BACKEND_URL ?? "http://localhost:5281"}/api/products/${id}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok)
    throw new Error(res.status === 404 ? "Product not found" : "Failed to load product");
  const product: Product = await res.json();
  return <EditProductForm product={product} />;
}
