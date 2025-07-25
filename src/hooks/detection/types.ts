// src/hooks/detection/types.ts
// 🔄 Re-export detection types from central location with consolidated error handling

import React from "react";

// ⭐ Import all detection types from consolidated location
export type {
  Detection,
  Stats,
  BarcodeData,
  APIResponse,
  ProcessingState,
  DetectionResult,
  UseBarcodeDetectionReturn,
  UseDetectionProcessorReturn,
  DetectionConfig,
  DetectionArea,
} from "../../types/detection";

// ✅ Import error types from consolidated errors (not from detection.ts)
export type { DetectionError, ApiError } from "../../types/errors";

// =========================================
// 🎯 Hook-specific interfaces (not in central types)
// =========================================

/**
 * Props for useDetectionProcessor hook
 */
export interface UseDetectionProcessorProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  lastDetectedCode: string;
  updateBarcode: (barcode: string) => Promise<void>;
}

/**
 * Detection settings configuration
 */
export interface DetectionSettings {
  autoProcess: boolean;
  processInterval: number;
  maxQueue: number;
  confidence: number;
  enableRotationCorrection: boolean;
}

// 🎯 This file now serves as a convenience re-export with hook-specific types
// Most type definitions are centralized in src/types/detection.ts and src/types/errors.ts
