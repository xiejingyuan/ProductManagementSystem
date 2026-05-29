export type ProductVariant = {
  id: number;
  productId: number;
  name: string;
  price: number | null;
  inventory: number;
  sku: string | null;
};

export type ProductImage = {
  id: number;
  productId: number;
  url: string;
  publicId: string;
  resourceType: string;
  altText: string | null;
  sortOrder: number;
};

export type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  inventory: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  userId: number;
  variants: ProductVariant[];
  images: ProductImage[];
};

export type AuthResponse = {
  token: string;
};

export type MessageResponse = {
  message: string;
};

export type AiDescriptionResponse = {
  description: string;
};

export type ActiveSession = {
  id: number;
  deviceInfo: string;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
};
