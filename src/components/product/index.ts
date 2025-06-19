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

// ✅ Export Enhanced State แทน ProductNotFoundState เก่า
export {
  EnhancedProductNotFoundState,
  EnhancedProductNotFoundState as ProductNotFoundState, // เพื่อ backward compatibility
} from "./EnhancedProductNotFoundState";

// Export utils
export * from "./utils";
