// Path: /src/hooks/camera/types.ts
export interface VideoConstraints {
  width: { ideal: number };
  height: { ideal: number };
  facingMode: "environment" | "user";
  // 🔥 NEW: Optional torch constraint for advanced usage
  torch?: boolean;
}

export interface CameraState {
  isStreaming: boolean;
  facingMode: "environment" | "user";
  resolution: {
    width: number;
    height: number;
  };
  // 🔥 NEW: Flash state
  flashEnabled: boolean;
  hasFlash: boolean;
}

export interface CameraError extends Error {
  name:
    | "NotAllowedError"
    | "NotFoundError"
    | "NotReadableError"
    | "OverconstrainedError"
    | "SecurityError"
    | "TypeError"
    | "AbortError";
}

export interface CameraCapabilities {
  facingMode?: string[];
  width?: {
    min: number;
    max: number;
  };
  height?: {
    min: number;
    max: number;
  };
  frameRate?: {
    min: number;
    max: number;
  };
  // 🔥 NEW: Torch capability
  torch?: boolean;
}

export interface CameraSettings {
  resolution: {
    width: number;
    height: number;
  };
  facingMode: "environment" | "user";
  frameRate: number;
  autoFocus: boolean;
  torch?: boolean; // For devices that support flashlight
}

export type CameraFacing = "environment" | "user";

// 🔥 UPDATED: Interface with flash properties
export interface UseCameraControlReturn {
  // Refs
  videoRef: React.RefObject<HTMLVideoElement>;

  // State
  isStreaming: boolean;
  errors: string | null;
  videoConstraints: VideoConstraints;

  // 🔥 NEW: Flash State
  flashEnabled: boolean;
  hasFlash: boolean;

  // Actions
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  switchCamera: () => void;
  setVideoConstraints: React.Dispatch<React.SetStateAction<VideoConstraints>>;

  // 🔥 NEW: Flash Actions
  toggleFlash: () => Promise<void>;
}

// 🔥 NEW: Flash-specific types
export interface FlashCapabilities {
  supported: boolean;
  currentState: boolean;
  canToggle: boolean;
}

export interface TorchConstraints {
  torch: boolean;
}

// 🔥 NEW: Extended MediaTrackCapabilities for better typing
export interface ExtendedMediaTrackCapabilities extends MediaTrackCapabilities {
  torch?: boolean;
}

// 🔥 NEW: Flash error types
export interface FlashError extends Error {
  code:
    | "FLASH_NOT_SUPPORTED"
    | "FLASH_TOGGLE_FAILED"
    | "FLASH_PERMISSION_DENIED";
  flashOperation: "check" | "enable" | "disable" | "toggle";
}
