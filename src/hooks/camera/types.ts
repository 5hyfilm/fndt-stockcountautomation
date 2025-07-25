// src/hooks/camera/types.ts
// 🔄 Re-export camera types from central location with consolidated error handling

// ⭐ Import all camera types from consolidated location
export type {
  VideoConstraints,
  CameraFacing,
  CameraState,
  CameraCapabilities,
  CameraSettings,
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

// ✅ Import CameraError from consolidated errors (not from camera.ts)
export type { CameraError } from "../../types/errors";

// 🎯 This file now serves as a convenience re-export
// All actual type definitions are centralized in src/types/camera.ts and src/types/errors.ts
