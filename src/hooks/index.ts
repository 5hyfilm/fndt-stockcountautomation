// Path: src/hooks/index.ts
// 🔄 Fixed export conflicts - explicit exports only

// =========================================
// 🪝 Main Hooks
// =========================================
export * from "./useBarcodeDetection";
export { useEmployeeAuth } from "./useEmployeeAuth";
export { useInventoryManager } from "./useInventoryManager";
export { useLogoutConfirmation } from "./useLogoutConfirmation";

// =========================================
// 📚 Sub-module Hooks & Types
// =========================================
export * from "./camera";
export * from "./detection";
export * from "./product";
export * from "./canvas";
export * from "./inventory";

// =========================================
// 🎯 Explicit Exports from types.ts (No Conflicts)
// =========================================
// Only export unique combined types
export type {
  UseBarcodeDetectionReturn,
  BarcodeDetectionConfig,
} from "./types";
