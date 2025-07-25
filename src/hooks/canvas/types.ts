// Path: src/hooks/canvas/types.ts
// 🔧 Fixed Import - BarcodeType now from central types

import { Detection } from "../detection/types";
import { Product, BarcodeType } from "../../types/product"; // ✅ FIXED: Import from central location

export interface CanvasDrawingOptions {
  strokeColor: string;
  fillColor: string;
  lineWidth: number;
  fontSize: number;
  fontFamily: string;
  markerSize: number;
  showConfidence: boolean;
  showBarcodeType: boolean;
  showProductName: boolean;
  showCornerMarkers: boolean;
}

export interface CanvasCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CanvasScale {
  scaleX: number;
  scaleY: number;
}

export interface DetectionDrawingParams {
  detection: Detection;
  coordinates: CanvasCoordinates;
  options: CanvasDrawingOptions;
  product?: Product | null;
  barcodeType?: BarcodeType | null;
}

export interface UseCanvasRendererReturn {
  // Refs
  canvasRef: React.RefObject<HTMLCanvasElement>;
  containerRef: React.RefObject<HTMLDivElement>;

  // Actions
  updateCanvasSize: () => void;
  drawDetections: (
    detections: Detection[],
    product: Product | null,
    detectedBarcodeType: BarcodeType | null,
    videoRef: React.RefObject<HTMLVideoElement>
  ) => void;
}

export interface CanvasConfiguration {
  enableAntialiasing: boolean;
  enableImageSmoothing: boolean;
  quality: "low" | "medium" | "high";
  backgroundColor?: string;
  overlayOpacity: number;
}

export interface CanvasTheme {
  primary: string;
  secondary: string;
  success: string;
  error: string;
  warning: string;
  info: string;
}
