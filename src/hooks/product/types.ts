// Path: src/hooks/product/types.ts
// 🔄 Re-export Product Types from Central Location
// This file now serves as a convenience re-export only

// ⭐ Import all product-related types from consolidated location
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

// 🎯 This file now serves as a convenience re-export
// All actual type definitions are centralized in src/types/product.ts
