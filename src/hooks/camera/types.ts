// src/hooks/camera/types.ts
// 🔄 Re-export camera types from central location

// ⭐ Import all camera types from consolidated location
export type {
  VideoConstraints,
  CameraFacing,
  CameraState,
  CameraCapabilities,
  CameraSettings,
  CameraError,
  UseCameraControlReturn,
  CameraViewfinderProps,
  CameraControlsProps,
  CameraPermissionState,
  CameraInitOptions,
  CameraStatus,
  CameraStats,
  CameraVideoConstraints,
  CameraStreamState,
  CameraAccessError,
} from "../../types/camera";

// 🎯 This file now serves as a convenience re-export
// All actual type definitions are centralized in src/types/camera.ts
