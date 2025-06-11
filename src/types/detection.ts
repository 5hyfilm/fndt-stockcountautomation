// src/types/detection.ts
export interface Detection {
  id: string;
  rawValue: string;
  format: string;
  timestamp: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  cornerPoints?: Array<{ x: number; y: number }>;
  confidence?: number;
}

export interface VideoConstraints {
  width: { ideal: number };
  height: { ideal: number };
  facingMode: "environment" | "user";
}

export interface DetectionStats {
  totalDetections: number;
  successfulDetections: number;
  lastDetectionTime: Date | null;
  rotation?: number;
  method?: string;
  confidence?: number;
  fps?: number;
  lastProcessTime?: number;
}

export interface CameraState {
  isStreaming: boolean;
  hasPermission: boolean;
  error: string | null;
  currentDevice?: string;
  availableDevices?: MediaDeviceInfo[];
}

export interface BarcodeDetectionOptions {
  formats?: string[];
  maxRetries?: number;
  confidence?: number;
  timeout?: number;
}

export interface ProcessingResult {
  success: boolean;
  detections: Detection[];
  error?: string;
  processingTime: number;
}
