// src/hooks/index.ts
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
export * from "./barcode";
export * from "./inventory";

// =========================================
// 🎯 Explicit Exports from types.ts (No Conflicts)
// =========================================
// Only export unique combined types
export type {
  UseBarcodeDetectionReturn,
  BarcodeDetectionConfig,
} from "./types";

// =========================================
// 🔄 Core Types Available Through Sub-modules
// =========================================
// These are already exported through their respective modules:
// - VideoConstraints, CameraFacing, etc. from "./camera"
// - Detection, BarcodeData, Stats, etc. from "./detection"
// - Product types from "./product"
// - Canvas types from "./canvas"
// - Barcode types from "./barcode"
