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
  timestamp: number;
  confidence: number;
  rotation_angle: number;
  decode_method: string;
}

export interface APIResponse {
  success: boolean;
  detections?: Detection[];
  barcodes?: BarcodeData[];
  error?: string;
  confidence?: number;
  rotation_angle?: number;
  decode_method?: string;
}
