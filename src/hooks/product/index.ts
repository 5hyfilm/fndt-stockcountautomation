// Path: src/hooks/product/index.ts
// 🔧 Fixed - Re-export types from central location instead of local types.ts

// =========================================
// 🪝 Product Hooks
// =========================================
export * from "./useProductInfo";
export * from "./useProductCache";
export * from "./useProductFetcher";
export * from "./useProductValidator";

// =========================================
// 🔄 Types Re-export from Central Location
// =========================================
// ⭐ Import product-related types from consolidated location
export type {
  // Core Product Types
  Product,
  NutritionInfo,

  // API Response Types
  ProductSearchParams,
  ProductResponse,
  ProductListResponse,
  DebugInfo,

  // Barcode Types
  BarcodeValidationResult,

  // Configuration Types
  ProductInfoConfig,
  FetchProductOptions,

  // Cache Types
  ProductCacheEntry,
  ProductCacheStats,

  // Hook Return Types
  UseProductInfoReturn,
  UseProductCacheProps,
  UseProductFetcherProps,
  UseProductCacheReturn,
  UseProductFetcherReturn,
  UseProductValidatorReturn,

  // Error Types
  ProductInfoError,
} from "../../types/product";

// ⭐ Re-export enums (must be imported as values, not types)
export {
  BarcodeType,
  ProductCategory,
  ProductStatus,
} from "../../types/product";

// =========================================
// 🎯 Convenience Exports & Defaults
// =========================================

// Convenience exports for backward compatibility
export { useProductInfo as useProductLookup } from "./useProductInfo";

// Default configurations
export const DEFAULT_PRODUCT_CONFIG = {
  enableCaching: true,
  cacheExpiryMs: 5 * 60 * 1000, // 5 minutes
  retryAttempts: 3,
  retryDelayMs: 1000,
  enableDebouncing: true,
  debounceDelayMs: 300,
};
