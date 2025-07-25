// src/hooks/types.ts
// 🔄 Central re-export for all hook types

// =========================================
// 📚 Hook Type Re-exports
// =========================================

export * from "./camera/types";
export * from "./detection/types";
export * from "./product/types";
export * from "./canvas/types";
export * from "./barcode/types";

// =========================================
// 🎯 Central Type Imports
// =========================================

import type {
  UseCameraControlReturn,
  VideoConstraints,
  CameraFacing,
  CameraState,
} from "../types/camera";

import type {
  UseDetectionProcessorReturn,
  Detection,
  BarcodeData,
  Stats,
} from "../types/detection";

import type { Product } from "../types/product"; // ✅ Import Product type

// Placeholder imports for other hook types
// import { UseProductLookupReturn } from "./product/types";
import type { UseCanvasRendererReturn } from "./canvas/types";

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

  // =========================================
  // 🎨 Canvas Actions
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

/**
 * Comprehensive barcode detection configuration
 */
export interface BarcodeDetectionConfig {
  camera: {
    defaultFacingMode: CameraFacing;
    resolution: {
      width: number;
      height: number;
    };
    autoStart: boolean;
    enableTorch: boolean;
  };
  detection: {
    autoProcess: boolean;
    processInterval: number;
    maxQueue: number;
    enableDebouncing: boolean;
    debounceDelay: number;
    confidenceThreshold: number;
  };
  product: {
    enableCaching: boolean;
    cacheExpiry: number;
    enableFallback: boolean;
    retryAttempts: number;
  };
  canvas: {
    enableDrawing: boolean;
    theme: "light" | "dark";
    showConfidence: boolean;
    showBarcodeType: boolean;
    overlayOpacity: number;
  };
}

// =========================================
// 🎯 Re-export Core Types for Convenience
// =========================================

export type {
  // Camera types
  UseCameraControlReturn,
  VideoConstraints,
  CameraFacing,
  CameraState,

  // Detection types
  UseDetectionProcessorReturn,
  Detection,
  BarcodeData,
  Stats,

  // Canvas types
  UseCanvasRendererReturn,
};
