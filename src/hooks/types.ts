// src/hooks/types.ts

// =========================================
// 📚 Hook Type Re-exports
// =========================================

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
import type { Product } from "../types/product";

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
  processingQueue: number;
  stats: Stats;
  captureAndProcess: () => Promise<void>;
  resetDetections: () => void;

  // =========================================
  // 🛒 Product Lookup State & Actions
  // =========================================
  lastDetectedCode: string;
  product: Product | null;
  detectedBarcodeType: "ea" | "dsp" | "cs" | null;
  productError: string | null;
  isLoadingProduct: boolean;

  // =========================================
  // 🎨 Canvas & Drawing
  // =========================================
  drawDetections: () => void;
  updateCanvasSize: () => void;

  // =========================================
  // 🎛️ Enhanced Actions
  // =========================================
  manualScan: () => Promise<void>;
  rescanCurrentView: () => Promise<void>;
  restartForNextScan: () => void;

  // =========================================
  // 🚨 Error Handling
  // =========================================
  errors: string | null;
  clearError: () => void;
}

// =========================================
// ⚙️ Configuration Types
// =========================================

export interface BarcodeDetectionConfig {
  autoStart?: boolean;
  autoProcess?: boolean;
  processInterval?: number;
  maxQueue?: number;
  enableDebouncing?: boolean;
  debounceDelay?: number;
  confidenceThreshold?: number;
  enableRotationCorrection?: boolean;
  defaultFacingMode?: CameraFacing;
  defaultResolution?: {
    width: number;
    height: number;
  };
}
