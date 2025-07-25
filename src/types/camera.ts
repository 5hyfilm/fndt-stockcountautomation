// src/types/camera.ts
// 🎥 Camera types with consolidated error handling

import React from "react";
// ✅ Import from consolidated errors
import type { CameraError } from "./errors";

// =========================================
// 📹 Basic Camera Types
// =========================================

/**
 * Camera facing mode options
 */
export type CameraFacing = "user" | "environment";

/**
 * Camera state enumeration
 */
export enum CameraState {
  IDLE = "idle",
  INITIALIZING = "initializing",
  STREAMING = "streaming",
  PAUSED = "paused",
  ERROR = "error",
  STOPPED = "stopped",
}

// =========================================
// ⚙️ Camera Configuration Types
// =========================================

/**
 * Video constraints for camera configuration
 */
export interface VideoConstraints {
  width?: number | { min: number; max: number; ideal?: number };
  height?: number | { min: number; max: number; ideal?: number };
  aspectRatio?: number;
  frameRate?: number | { min: number; max: number; ideal?: number };
  facingMode?: CameraFacing | { exact: CameraFacing } | { ideal: CameraFacing };
  deviceId?: string | { exact: string } | { ideal: string };
  resizeMode?: "none" | "crop-and-scale";
  zoom?: number | { min: number; max: number };
}

/**
 * Camera capabilities from getUserMedia
 */
export interface CameraCapabilities {
  width?: {
    min: number;
    max: number;
  };
  height?: {
    min: number;
    max: number;
  };
  aspectRatio?: {
    min: number;
    max: number;
  };
  frameRate?: {
    min: number;
    max: number;
  };
  facingMode?: string[];
  resizeMode?: string[];
  deviceId?: string;
  groupId?: string;
}

/**
 * Advanced camera settings
 */
export interface CameraSettings {
  resolution: {
    width: number;
    height: number;
  };
  facingMode: CameraFacing;
  frameRate: number;
  autoFocus: boolean;
  torch?: boolean; // For devices that support flashlight
  zoom?: number;
  exposureCompensation?: number;
  whiteBalanceMode?: "auto" | "manual" | "continuous";
  focusMode?: "auto" | "manual" | "continuous";
}

// =========================================
// 🪝 Hook Return Types
// =========================================

/**
 * Return type for useCameraControl hook
 */
export interface UseCameraControlReturn {
  // Refs
  videoRef: React.RefObject<HTMLVideoElement>;

  // State
  isStreaming: boolean;
  errors: string | null;
  videoConstraints: VideoConstraints;
  torchOn: boolean;

  // Actions
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  switchCamera: () => void;
  toggleTorch: () => void;
  setVideoConstraints: React.Dispatch<React.SetStateAction<VideoConstraints>>;
}

// =========================================
// 📱 Component Props Types
// =========================================

/**
 * Detection interface for camera viewfinder
 */
interface Detection {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
  confidence: number;
  class: number;
}

/**
 * Camera viewfinder component props
 */
export interface CameraViewfinderProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  containerRef: React.RefObject<HTMLDivElement>;
  isStreaming: boolean;
  detections: Detection[];
  onLoadedMetadata: () => void;
  fullScreen?: boolean;
  showGuideFrame?: boolean;
}

/**
 * Camera control panel props
 */
export interface CameraControlsProps {
  isStreaming: boolean;
  torchOn?: boolean;
  facingMode: CameraFacing;
  onStartCamera: () => Promise<void>;
  onStopCamera: () => void;
  onSwitchCamera: () => void;
  onToggleTorch?: () => void;
  disabled?: boolean;
}

// =========================================
// 🔧 Utility Types
// =========================================

/**
 * Camera permission state
 */
export type CameraPermissionState = "granted" | "denied" | "prompt" | "unknown";

/**
 * Camera initialization options
 */
export interface CameraInitOptions {
  autoStart?: boolean;
  defaultFacingMode?: CameraFacing;
  defaultResolution?: {
    width: number;
    height: number;
  };
  enableTorch?: boolean;
}

/**
 * Camera status info
 */
export interface CameraStatus {
  isSupported: boolean;
  isStreaming: boolean;
  permissionState: CameraPermissionState;
  activeDevice?: MediaDeviceInfo;
  availableDevices: MediaDeviceInfo[];
  currentResolution?: {
    width: number;
    height: number;
  };
}

// =========================================
// 📊 Performance & Stats Types
// =========================================

/**
 * Camera performance statistics
 */
export interface CameraStats {
  frameRate: number;
  resolution: {
    width: number;
    height: number;
  };
  bytesPerSecond: number;
  lastUpdateTime: number;
}

// =========================================
// 🔄 Backward Compatibility Types
// =========================================

/**
 * Export consolidated error type for compatibility
 * ✅ Now using consolidated CameraError from errors.ts
 */
export type { CameraError } from "./errors";

/**
 * Re-export core types for backwards compatibility
 */
export type CameraVideoConstraints = VideoConstraints;
export type CameraStreamState = CameraState;
export type CameraAccessError = CameraError;
