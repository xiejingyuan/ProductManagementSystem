import type { Product } from "@/lib/types";
import { serverFetch } from "@/lib/server-api";
import EditProductForm from "./EditProductForm";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await serverFetch<Product>(`/api/products/${id}`);
  return <EditProductForm product={product} />;
}
