// Path: src/hooks/types.ts
// 🔧 Fixed - Re-export product types from central location

// =========================================
// 📚 Hook Type Re-exports
// =========================================

export * from "./camera/types";
export * from "./detection/types";
export * from "./canvas/types";
export * from "./../types/barcode";

// ⭐ Product types now re-exported from central location
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
} from "../types/product";

// ⭐ Re-export product enums
export { BarcodeType, ProductCategory, ProductStatus } from "../types/product";

// =========================================
// 🎯 Central Type Imports for Combined Types
// =========================================

import type { VideoConstraints, CameraFacing } from "../types/camera";

import type { Detection, Stats } from "../types/detection";

import type { Product } from "../types/product"; // ✅ Import Product type

// =========================================
// 🔗 Combined Hook Return Types
// =========================================

/**
 * Combined return type for useBarcodeDetection hook
 */
export interface UseBarcodeDetectionReturn {
  // =========================================
  // 📚 Refs
  // =========================================
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  containerRef: React.RefObject<HTMLDivElement>;

  // =========================================
  // 🎥 Camera State & Actions
  // =========================================
  isStreaming: boolean;
  videoConstraints: VideoConstraints;
  torchOn: boolean; // ✅ Fixed: Required instead of optional
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  switchCamera: () => void;
  toggleTorch: () => void; // ✅ Fixed: Required instead of optional
  setVideoConstraints: React.Dispatch<React.SetStateAction<VideoConstraints>>;

  // =========================================
  // 🔍 Detection State & Actions
  // =========================================
  detections: Detection[];
  processingQueue: number;
  stats: Stats;
  captureAndProcess: () => Promise<void>;
  resetDetections: () => void;

  // =========================================
  // 🛒 Product Lookup State (Fixed property names)
  // =========================================
  product: Product | null; // ✅ Fixed: Use proper Product type instead of any
  detectedBarcodeType: "ea" | "dsp" | "cs" | null; // ✅ Fixed type
  isLoadingProduct: boolean; // ✅ Fixed property name
  productError: string | null; // ✅ Fixed property name
  lastDetectedCode: string; // ✅ Added missing property
  errors: string | null; // ✅ Fixed: Changed from string[] to string | null to match component expectations

  // =========================================
  // 🎨 Canvas Actions
  // =========================================
  drawDetections: () => void;
  updateCanvasSize: () => void;

  // =========================================
  // 🎛️ Enhanced Actions
  // =========================================
  manualScan: () => Promise<void>;
  rescanCurrentView: () => Promise<void>; // ✅ Added missing rescanCurrentView function
  restartForNextScan: () => void;
  clearError: () => void; // ✅ Added missing clearError function
}

/**
 * Configuration for barcode detection hook
 */
export interface BarcodeDetectionConfig {
  // Camera config
  defaultFacingMode: CameraFacing;
  enableTorch: boolean;

  // Detection config
  processInterval: number;
  maxProcessingQueue: number;

  // Product config
  enableProductLookup: boolean;
  enableCaching: boolean;
  cacheExpiryMs: number;
}
