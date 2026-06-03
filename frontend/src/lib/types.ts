export type ProductImage = {
  id: number;
  productId: number;
  url: string;
  publicId: string;
  resourceType: string;
  isMain: boolean;
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
