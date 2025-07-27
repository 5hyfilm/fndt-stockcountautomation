// Path: src/hooks/index.ts

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
// export * from "./barcode"; // 🚫 REMOVED - no actual hooks, only types
export * from "./inventory";

// =========================================
// 🎯 Explicit Exports from types.ts (No Conflicts)
// =========================================
export type {
  UseBarcodeDetectionReturn,
  BarcodeDetectionConfig,
} from "./types";

// =========================================
// 🔄 Barcode Types Now Available Through Central Types
// =========================================
// Barcode types now imported directly from:
// import { BarcodeFormat, BarcodeValidation } from '../types/barcode'
