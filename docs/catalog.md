# Catalog & inventory (Phase 2)

## Source of truth

PostgreSQL holds products, categories, ingredients, skin types, concerns, images, and inventory. Public storefront reads **ACTIVE** products only via `liveCatalogService`.

Tenant resolution for the storefront uses `DEFAULT_TENANT_SLUG` (server env) — never client `tenantId`.

## Services

| Service         | Path                                                   |
| --------------- | ------------------------------------------------------ |
| Public catalog  | `src/modules/catalog/public-catalog.service.ts`        |
| Admin products  | `src/modules/products/admin-product.service.ts`        |
| Inventory       | `src/modules/inventory/inventory.service.ts`           |
| Recommendations | `src/modules/recommendations/recommendation.engine.ts` |

## Pagination

Offset pagination, default **20**, max **50** (`catalog.constants.ts`).

## Inventory

- `stock` — on-hand units
- `reservedStock` — checkout reservations (Phase 3+)
- Sellable = `stock - reservedStock`
- All changes go through `InventoryTransaction` with audit logs.

## Recommendations

Deterministic scoring in `recommendation.engine.ts`. `/routine` uses `recommendRoutineAction` (server). Results may persist to `CustomerRecommendation` for logged-in customers.

## Commands

```bash
npm run db:migrate:deploy
npm run db:seed
```
