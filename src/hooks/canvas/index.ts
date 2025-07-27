// Path: src/hooks/canvas/index.ts

export * from "./useCanvasRenderer";
// ❌ Remove old types export - now in central location
// export * from "./types";

// ✅ Re-export canvas types from central location for backward compatibility
export type {
  CanvasDrawingOptions,
  CanvasCoordinates,
  CanvasScale,
  DetectionDrawingParams,
  UseCanvasRendererReturn,
  CanvasConfiguration,
  CanvasTheme,
} from "../../types/canvas";

// ✅ Re-export ProductUnitType for convenience
export type { ProductUnitType } from "../../types/product";
