-- Catalog and cart query indexes for 10k+ products / 100k+ users.
-- Trigram indexes let ILIKE '%term%' on name/sku/slug use an index instead of a sequential scan.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "Category_tenantId_name_idx" ON "Category"("tenantId", "name");

CREATE INDEX "Product_tenantId_status_featured_createdAt_idx" ON "Product"("tenantId", "status", "featured", "createdAt");
CREATE INDEX "Product_tenantId_status_priceMinor_idx" ON "Product"("tenantId", "status", "priceMinor");
CREATE INDEX "Product_tenantId_status_categoryId_idx" ON "Product"("tenantId", "status", "categoryId");
CREATE INDEX "Product_tenantId_status_routineStep_idx" ON "Product"("tenantId", "status", "routineStep");

CREATE INDEX "Product_name_trgm_idx" ON "Product" USING GIN ("name" gin_trgm_ops);
CREATE INDEX "Product_sku_trgm_idx" ON "Product" USING GIN ("sku" gin_trgm_ops);
CREATE INDEX "Product_slug_trgm_idx" ON "Product" USING GIN ("slug" gin_trgm_ops);

CREATE INDEX "ProductImage_productId_sortOrder_idx" ON "ProductImage"("productId", "sortOrder");

CREATE INDEX "ProductIngredient_ingredientId_idx" ON "ProductIngredient"("ingredientId");
CREATE INDEX "ProductSkinType_skinTypeId_idx" ON "ProductSkinType"("skinTypeId");
CREATE INDEX "ProductConcern_concernId_idx" ON "ProductConcern"("concernId");

CREATE INDEX "Cart_tenantId_customerId_status_idx" ON "Cart"("tenantId", "customerId", "status");
CREATE INDEX "Cart_tenantId_sessionKey_status_idx" ON "Cart"("tenantId", "sessionKey", "status");
