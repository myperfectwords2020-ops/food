import type { CatalogService } from "./catalog.service";
import {
  getCompleteRoutinePublicProducts,
  getPublicProductById,
  getPublicProductBySlug,
  getRelatedPublicProducts,
  listPublicCategories,
  listPublicConcerns,
  listPublicProducts,
  listPublicSkinTypes,
} from "@/modules/catalog/public-catalog.service";

export const liveCatalogService: CatalogService = {
  listProducts: listPublicProducts,
  getProductBySlug: getPublicProductBySlug,
  getProductById: getPublicProductById,
  getRelatedProducts: getRelatedPublicProducts,
  getCompleteRoutineProducts: getCompleteRoutinePublicProducts,
  listCategories: listPublicCategories,
  listSkinTypes: listPublicSkinTypes,
  listConcerns: listPublicConcerns,
};
