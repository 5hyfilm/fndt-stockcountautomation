// src/types/detection.ts
// 🔍 Detection types with consolidated error handling

import React from "react";
import type { VideoConstraints } from "./camera";
// ✅ Import from consolidated errors

// =========================================
// 📊 Detection Stats & Performance
// =========================================

export interface Stats {
  rotation: number;
  method: string;
  confidence: number;
  fps: number;
  lastProcessTime: number;
}

export interface Detection {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
  confidence: number;
  class: number;
}

// =========================================
// 🔍 Barcode Detection Types
// =========================================

export interface BarcodeData {
  data: string;
  type: string;
  timestamp?: string;
  confidence?: number;
  rotation_angle?: number;
  decode_method?: string;
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface APIResponse {
  success: boolean;
  detections?: Detection[];
  barcodes?: BarcodeData[];
  error?: string;
  confidence?: number;
  rotation_angle?: number;
  decode_method?: string;
  filename?: string;
  barcodes_found?: number;
  mock?: boolean;
  results?: Array<{
    type: string;
    data: string;
    confidence?: number;
    rotation_angle?: number;
    decode_method?: string;
    position: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    timestamp: string;
  }>;
}

// =========================================
// 🔄 Processing State Types
// =========================================

export interface ProcessingState {
  isProcessing: boolean;
  queue: number;
  maxQueue: number;
}

export interface DetectionResult {
  success: boolean;
  data?: string;
  confidence: number;
  processingTime: number;
  method: string;
  error?: string;
}

// =========================================
// 🪝 Detection Hook Return Types
// =========================================

export interface UseBarcodeDetectionReturn {
  // Refs
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  containerRef: React.RefObject<HTMLDivElement>;

  // State
  isStreaming: boolean;
  detections: Detection[];
  processingQueue: number;
  stats: Stats;
  errors: string | null;
  videoConstraints: VideoConstraints;

  // Actions
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  switchCamera: () => void;
  captureAndProcess: () => Promise<void>;
  drawDetections: () => void;
  updateCanvasSize: () => void;
  clearError: () => void;
}

export interface UseDetectionProcessorReturn {
  // State
  detections: Detection[];
  processingQueue: number;
  lastDetectedCode: string;
  stats: Stats;
  isProcessing: boolean;

  // Actions
  captureAndProcess: () => Promise<void>;
  resetDetections: () => void;
  updateStats: (newStats: Partial<Stats>) => void;
}

// =========================================
// ⚙️ Detection Configuration Types
// =========================================

export interface DetectionConfig {
  autoProcess: boolean;
  processInterval: number;
  maxQueue: number;
  enableDebouncing: boolean;
  debounceDelay: number;
  confidenceThreshold: number;
  enableRotationCorrection: boolean;
}

export interface DetectionArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

// =========================================
// 🔄 Backward Compatibility & Re-exports
// =========================================

/**
 * Export consolidated error types for compatibility
 * ✅ Now using consolidated DetectionError and ApiError from errors.ts
 */
export type { DetectionError, ApiError } from "./errors";

/**
 * Re-export camera types that are commonly used with detection
 */
export type {
  VideoConstraints,
  CameraFacing,
  CameraState,
  CameraError,
} from "./camera";
