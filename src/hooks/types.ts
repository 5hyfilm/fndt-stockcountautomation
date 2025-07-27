// Path: src/hooks/types.ts

// =========================================
// 📚 Hook Type Re-exports
// =========================================

export * from "./detection/types";
export * from "../types/canvas"; // ✅ Updated: Import from central types location
export * from "../types/barcode";

// ⭐ Product types now re-exported from central location
export type {
  Product,
  NutritionInfo,
  ProductSearchParams,
  ProductResponse,
  ProductListResponse,
  DebugInfo,
  BarcodeValidationResult,
  ProductInfoConfig,
  FetchProductOptions,
  ProductCacheEntry,
  ProductCacheStats,
  UseProductInfoReturn,
  UseProductCacheProps,
  UseProductFetcherProps,
  UseProductCacheReturn,
  UseProductFetcherReturn,
  UseProductValidatorReturn,
  ProductInfoError,
  ProductUnitType, // ✅ Added ProductUnitType export
} from "../types/product";

export {
  BarcodeType,
  ProductCategory,
  ProductStatus,
  PRODUCT_UNIT_TYPES, // ✅ Added constant export
} from "../types/product";

// =========================================
// 🎯 Central Type Imports for Combined Types
// =========================================

import type { VideoConstraints } from "../types/camera";
import type { Detection, Stats } from "../types/detection";
import type { Product, ProductUnitType } from "../types/product";

// =========================================
// 🔗 Combined Hook Return Types
// =========================================

/**
 * Combined return type for useBarcodeDetection hook
 * ✅ FIXED: Updated to match actual implementation
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
  torchOn: boolean;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  switchCamera: () => void;
  toggleTorch: () => void;
  setVideoConstraints: React.Dispatch<React.SetStateAction<VideoConstraints>>;

  // =========================================
  // 🔍 Detection State & Actions
  // =========================================
  detections: Detection[];
  processingQueue: number; // ✅ FIXED: Added missing property
  stats: Stats;
  captureAndProcess: () => Promise<void>; // ✅ FIXED: Added missing property
  resetDetections: () => void;
  lastDetectedCode: string; // ✅ FIXED: Changed from string | null to string

  // =========================================
  // 🛒 Product State & Actions
  // =========================================
  product: Product | null;
  detectedBarcodeType: "ea" | "dsp" | "cs" | null;
  isLoadingProduct: boolean; // ✅ FIXED: Added missing property
  productError: string | null; // ✅ FIXED: Added missing property
  clearProduct: () => void;

  // =========================================
  // 🎨 Canvas Actions
  // =========================================
  updateCanvasSize: () => void;
  drawDetections: () => void;

  // =========================================
  // 🎛️ Enhanced Actions
  // =========================================
  manualScan: () => Promise<void>;
  rescanCurrentView: () => Promise<void>;
  restartForNextScan: () => void; // ✅ FIXED: Added missing property

  // =========================================
  // 🚨 Error Handling
  // =========================================
  errors: string | null; // ✅ FIXED: Added missing property
  clearError: () => void;
}

// =========================================
// ⚙️ Configuration Types
// =========================================

export interface BarcodeDetectionConfig {
  // Detection settings
  confidenceThreshold: number;
  maxDetections: number;
  processInterval: number;

  // Camera settings
  defaultVideoConstraints: VideoConstraints;

  // Product lookup settings
  enableProductLookup: boolean;
  cacheProducts: boolean;

  // Canvas settings
  enableCanvas: boolean;
  canvasSettings: {
    strokeColor: string;
    fillColor: string;
    lineWidth: number;
  };
}

// =========================================
// 🔄 Additional Hook Types (if needed)
// =========================================

export interface UseDetectionProcessorReturn {
  detections: Detection[];
  processingQueue: number;
  stats: Stats;
  captureAndProcess: () => Promise<void>;
  resetDetections: () => void;
}

export interface UseProductLookupReturn {
  product: Product | null;
  detectedBarcodeType: ProductUnitType | null; // ✅ Changed to ProductUnitType
  isLoadingProduct: boolean;
  productError: string | null;
  lastDetectedCode: string;
  updateBarcode: (barcode: string) => Promise<void>;
  clearProduct: () => void;
  clearCurrentDetection: () => void;
}
