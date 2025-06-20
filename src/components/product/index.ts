// src/components/product/index.ts
// Export all product components

export { ProductHeader } from "./ProductHeader";
export { ProductBasicInfo } from "./ProductBasicInfo";
export { InventoryAddSection } from "./InventoryAddSection";
export { ProductDescription } from "./ProductDescription";
export { BarcodeInfo } from "./BarcodeInfo";
export { ProductDetails } from "./ProductDetails";
export { NutritionInfo } from "./NutritionInfo";

// Export Empty States
export { LoadingState, ErrorState, WaitingScanState } from "./EmptyStates";

// ✅ Export Enhanced State (updated import path)
export { EnhancedProductNotFoundState } from "./EnhancedProductNotFoundState";

// ✅ Backward compatibility alias
export { EnhancedProductNotFoundState as ProductNotFoundState } from "./EnhancedProductNotFoundState";

// Export utils
export * from "./utils";
