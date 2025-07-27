// src/hooks/index.ts
export * from "./useBarcodeDetection";
export { useEmployeeAuth } from "./useEmployeeAuth";
export { useInventoryManager } from "./useInventoryManager";
export { useLogoutConfirmation } from "./useLogoutConfirmation";

export { useCameraControl } from "./camera/useCameraControl";
export * from "./camera/types";
export * from "./detection";
export * from "./product";
export * from "./canvas";
export * from "./inventory";

export type {
  UseBarcodeDetectionReturn,
  BarcodeDetectionConfig,
} from "./types";
