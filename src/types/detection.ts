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

export interface VideoConstraints {
  width: { ideal: number };
  height: { ideal: number };
  facingMode: "environment" | "user";
}

export interface BarcodeData {
  data: string;
  type: string;
  timestamp?: number;
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
  results?: Array<{
    type: string;
    data: string;
    position: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    timestamp: string;
  }>;
}

// Additional utility types
export type CameraFacing = "environment" | "user";

export interface CameraState {
  isStreaming: boolean;
  facingMode: CameraFacing;
  resolution: {
    width: number;
    height: number;
  };
}

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

// Ref types ที่ไม่ strict
export interface VideoElementRef {
  current: HTMLVideoElement | null;
}

export interface CanvasElementRef {
  current: HTMLCanvasElement | null;
}

export interface DivElementRef {
  current: HTMLDivElement | null;
}
