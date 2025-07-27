// src/hooks/index.ts

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
export * from "./camera/useCameraControl";
export * from "./detection";
export * from "./product";
export * from "./canvas";
export * from "./inventory";

// =========================================
// 🎯 Explicit Exports from types.ts (No Conflicts)
// =========================================
export type {
  UseBarcodeDetectionReturn,
  BarcodeDetectionConfig,
} from "./types";