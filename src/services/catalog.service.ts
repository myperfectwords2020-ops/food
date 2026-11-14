import type { Product, ProductFilters, ProductListResult } from "@/types/commerce";

export interface CatalogService {
  listProducts(filters: ProductFilters): Promise<ProductListResult>;
  getProductBySlug(slug: string): Promise<Product | null>;
  getProductById(id: string): Promise<Product | null>;
  getRelatedProducts(slug: string, limit?: number): Promise<Product[]>;
  getCompleteRoutineProducts(slug: string): Promise<Product[]>;
  listCategories(): Promise<string[]>;
  listSkinTypes(): Promise<string[]>;
  listConcerns(): Promise<string[]>;
}
