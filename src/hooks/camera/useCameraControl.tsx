// src/hooks/camera/useCameraControl.tsx
// 🎥 Camera control hook with consolidated error handling

"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import type { VideoConstraints } from "./types";
// ✅ Import from consolidated errors
import {
  CameraError,
  CameraErrorCode,
  createCameraError,
  legacyCameraErrorToCode,
  getUserFriendlyMessage,
  isAppError,
  LegacyCameraErrorName,
} from "../../types/errors";

// =========================================
// 🛡️ Enhanced Error Handling Utilities
// =========================================

/**
 * Helper function to create camera error from MediaError
 * ✅ Now using consolidated error factory
 */
const createCameraErrorFromMediaError = (
  error: unknown,
  context?: Record<string, unknown>
): CameraError => {
  if (error instanceof Error) {
    // Map legacy camera error names to consolidated error codes
    const errorName = error.name as LegacyCameraErrorName;
    const errorCode = legacyCameraErrorToCode(errorName);

    return createCameraError(errorCode, error.message, {
      cause: error,
      context,
      userMessage: getUserFriendlyMessage(
        createCameraError(errorCode, error.message)
      ),
    });
  }

  // Fallback for unknown errors
  return createCameraError(
    CameraErrorCode.STREAM_ERROR,
    typeof error === "string" ? error : "เกิดข้อผิดพลาดในการเปิดกล้อง",
    { cause: error, context }
  );
};

/**
 * Get user-friendly error message
 * ✅ Now using consolidated error utilities
 */

// =========================================
// 🪝 Enhanced Camera Control Hook
// =========================================

export const useCameraControl = () => {
  // =========================================
  // 📚 Refs
  // =========================================
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // =========================================
  // 🏗️ State Management
  // =========================================
  const [isStreaming, setIsStreaming] = useState(false);
  const [errors, setErrors] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [videoConstraints, setVideoConstraints] = useState<VideoConstraints>({
    width: { min: 640, ideal: 1920, max: 1920 },
    height: { min: 480, ideal: 1080, max: 1080 },
    facingMode: "environment",
    aspectRatio: 16 / 9,
  });

  // =========================================
  // 🧹 Cleanup Effect
  // =========================================
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // =========================================
  // 🎥 Camera Actions
  // =========================================

  /**
   * Enhanced start camera with better error handling
   * ✅ Now using consolidated error handling
   */
  const startCamera = useCallback(async () => {
    try {
      setErrors(null);

      // Stop existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Check for camera support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw createCameraError(
          CameraErrorCode.NOT_FOUND,
          "เบราว์เซอร์ไม่รองรับการเข้าถึงกล้อง",
          { context: { userAgent: navigator.userAgent } }
        );
      }

      console.log(
        "🎥 Requesting camera access with constraints:",
        videoConstraints
      );

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      });

      // Verify video element
      if (!videoRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        throw createCameraError(
          CameraErrorCode.STREAM_ERROR,
          "Video element ไม่พร้อมใช้งาน",
          { context: { videoRef: "null" } }
        );
      }

      // Set up video stream
      videoRef.current.srcObject = stream;
      streamRef.current = stream;

      // Wait for video to be ready
      await new Promise<void>((resolve, reject) => {
        if (!videoRef.current) {
          reject(
            createCameraError(
              CameraErrorCode.STREAM_ERROR,
              "Video element หายไประหว่างการติดตั้ง"
            )
          );
          return;
        }

        const video = videoRef.current;

        const handleLoadedMetadata = () => {
          video.removeEventListener("loadedmetadata", handleLoadedMetadata);
          video.removeEventListener("error", handleError);
          resolve();
        };

        const handleError = (event: Event) => {
          video.removeEventListener("loadedmetadata", handleLoadedMetadata);
          video.removeEventListener("error", handleError);

          const error = createCameraError(
            CameraErrorCode.STREAM_ERROR,
            "ไม่สามารถโหลด video metadata ได้",
            {
              cause: event,
              context: {
                videoReadyState: video.readyState,
                videoError: video.error?.message,
              },
            }
          );
          reject(error);
        };

        video.addEventListener("loadedmetadata", handleLoadedMetadata);
        video.addEventListener("error", handleError);

        // Timeout fallback
        setTimeout(() => {
          video.removeEventListener("loadedmetadata", handleLoadedMetadata);
          video.removeEventListener("error", handleError);
          reject(
            createCameraError(
              CameraErrorCode.TIMEOUT,
              "Timeout ในการโหลด video"
            )
          );
        }, 10000);
      });

      await videoRef.current.play();
      setIsStreaming(true);

      console.log("✅ Camera started successfully");
    } catch (error) {
      console.error("❌ Camera start failed:", error);

      // Handle specific error types
      const cameraError = isAppError(error)
        ? error
        : createCameraErrorFromMediaError(error, {
            requestedConstraints: videoConstraints,
            timestamp: Date.now(),
          });

      setErrors(getUserFriendlyMessage(cameraError));
      setIsStreaming(false);

      // Clean up on error
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      throw cameraError;
    }
  }, [videoConstraints]);

  /**
   * Enhanced stop camera
   */
  const stopCamera = useCallback(() => {
    try {
      console.log("🛑 Stopping camera...");

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          console.log(`Stopping track: ${track.kind} - ${track.label}`);
          track.stop();
        });
        streamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      setIsStreaming(false);
      setTorchOn(false);
      setErrors(null);

      console.log("✅ Camera stopped successfully");
    } catch (error) {
      console.error("❌ Error stopping camera:", error);

      const cameraError = createCameraErrorFromMediaError(error, {
        action: "stop",
        timestamp: Date.now(),
      });

      setErrors(getUserFriendlyMessage(cameraError));
    }
  }, []);

  /**
   * Enhanced switch camera
   */
  const switchCamera = useCallback(() => {
    try {
      console.log("🔄 Switching camera...");

      setVideoConstraints((prev) => ({
        ...prev,
        facingMode: prev.facingMode === "environment" ? "user" : "environment",
      }));

      // Restart camera with new constraints if currently streaming
      if (isStreaming) {
        stopCamera();
        // Small delay to ensure cleanup
        setTimeout(() => {
          startCamera().catch((error) => {
            console.error("Failed to restart camera after switch:", error);
          });
        }, 100);
      }
    } catch (error) {
      console.error("❌ Error switching camera:", error);

      const cameraError = createCameraErrorFromMediaError(error, {
        action: "switch",
        currentFacingMode: videoConstraints.facingMode,
        timestamp: Date.now(),
      });

      setErrors(getUserFriendlyMessage(cameraError));
    }
  }, [isStreaming, startCamera, stopCamera, videoConstraints.facingMode]);

  /**
   * Enhanced toggle torch
   */
  const toggleTorch = useCallback(async () => {
    try {
      if (!streamRef.current) {
        throw createCameraError(
          CameraErrorCode.STREAM_ERROR,
          "ไม่มี camera stream สำหรับเปิด/ปิด torch"
        );
      }

      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (!videoTrack) {
        throw createCameraError(
          CameraErrorCode.STREAM_ERROR,
          "ไม่พบ video track สำหรับควบคุม torch"
        );
      }

      const capabilities = videoTrack.getCapabilities();
      if (!capabilities.torch) {
        throw createCameraError(
          CameraErrorCode.NOT_FOUND,
          "อุปกรณ์นี้ไม่รองรับ torch",
          { context: { capabilities } }
        );
      }

      const newTorchState = !torchOn;
      await videoTrack.applyConstraints({
        advanced: [{ torch: newTorchState }],
      });

      setTorchOn(newTorchState);
      console.log(`🔦 Torch ${newTorchState ? "ON" : "OFF"}`);
    } catch (error) {
      console.error("❌ Error toggling torch:", error);

      const cameraError = createCameraErrorFromMediaError(error, {
        action: "toggleTorch",
        currentTorchState: torchOn,
        timestamp: Date.now(),
      });

      setErrors(getUserFriendlyMessage(cameraError));
    }
  }, [torchOn]);

  // =========================================
  // 🎯 Return Interface
  // =========================================

  return {
    // Refs
    videoRef,

    // State
    isStreaming,
    errors,
    videoConstraints,
    torchOn,

    // Actions
    startCamera,
    stopCamera,
    switchCamera,
    toggleTorch,
    setVideoConstraints,
  };
};
