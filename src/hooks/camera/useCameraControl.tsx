// Path: /src/hooks/camera/useCameraControl.tsx
"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { VideoConstraints } from "../../types/detection";

// Define proper error type instead of using any
interface CameraError {
  message: string;
  name?: string;
  code?: string;
  cause?: unknown;
}

// Type guard to check if error has message property
const isErrorWithMessage = (error: unknown): error is CameraError => {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as Record<string, unknown>).message === "string"
  );
};

// Helper function to get error message
const getErrorMessage = (error: unknown): string => {
  if (isErrorWithMessage(error)) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "เกิดข้อผิดพลาดในการเปิดกล้อง";
};

export const useCameraControl = () => {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null!);
  const streamRef = useRef<MediaStream | null>(null);

  // State
  const [isStreaming, setIsStreaming] = useState(false);
  const [errors, setErrors] = useState<string | null>(null);
  const [videoConstraints, setVideoConstraints] = useState<VideoConstraints>({
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: "environment",
  });

  // 🔥 NEW: Flash/Torch State
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [hasFlash, setHasFlash] = useState(false);

  // 🔥 NEW: Check if device supports torch/flashlight
  const checkFlashSupport = useCallback(async () => {
    try {
      const stream = streamRef.current;
      if (stream) {
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          const capabilities = videoTrack.getCapabilities();
          const supportsFlash = "torch" in capabilities && capabilities.torch;
          setHasFlash(!!supportsFlash);
          console.log("🔦 Flash support:", !!supportsFlash);
          return !!supportsFlash;
        }
      }
      return false;
    } catch (error) {
      console.log("🔦 Flash check error:", error);
      setHasFlash(false);
      return false;
    }
  }, []);

  // 🔥 NEW: Toggle Flash/Torch
  const toggleFlash = useCallback(async () => {
    try {
      const stream = streamRef.current;
      if (!stream || !hasFlash) {
        console.log("🔦 Flash not available");
        return;
      }

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const newFlashState = !flashEnabled;

        await videoTrack.applyConstraints({
          advanced: [{ torch: newFlashState }],
        });

        setFlashEnabled(newFlashState);
        console.log("🔦 Flash toggled:", newFlashState ? "ON" : "OFF");
      }
    } catch (error) {
      console.error("🔦 Flash toggle error:", error);
      // Reset flash state on error
      setFlashEnabled(false);
    }
  }, [flashEnabled, hasFlash]);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setErrors(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      });

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);

        await new Promise<void>((resolve) => {
          video.onloadedmetadata = () => resolve();
        });

        // 🔥 NEW: Check flash support after camera starts
        setTimeout(() => {
          checkFlashSupport();
        }, 500);
      }
    } catch (error: unknown) {
      console.error("Error starting camera:", error);

      // Use proper error handling instead of any
      const errorMessage =
        isErrorWithMessage(error) && error.name
          ? error.name === "NotAllowedError"
            ? "กรุณาอนุญาตการใช้งานกล้อง"
            : error.name === "NotFoundError"
            ? "ไม่พบกล้องในอุปกรณ์"
            : `เกิดข้อผิดพลาด: ${error.message}`
          : getErrorMessage(error);

      setErrors(errorMessage);
    }
  }, [videoConstraints, checkFlashSupport]);

  // Stop camera
  const stopCamera = useCallback(() => {
    // 🔥 NEW: Turn off flash before stopping
    if (flashEnabled && streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        try {
          videoTrack
            .applyConstraints({
              advanced: [{ torch: false }],
            })
            .catch(console.warn);
        } catch (error) {
          console.warn("Error turning off flash:", error);
        }
      }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }

    setIsStreaming(false);
    // 🔥 NEW: Reset flash state when camera stops
    setFlashEnabled(false);
    setHasFlash(false);
  }, [flashEnabled]);

  // Switch camera
  const switchCamera = useCallback(() => {
    if (isStreaming) {
      stopCamera();
      setVideoConstraints((prev) => ({
        ...prev,
        facingMode: prev.facingMode === "environment" ? "user" : "environment",
      }));
    }
  }, [isStreaming, stopCamera]);

  // Auto-restart camera when constraints change
  useEffect(() => {
    if (isStreaming) {
      stopCamera();
      setTimeout(() => startCamera(), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoConstraints.facingMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    // Refs
    videoRef,

    // State
    isStreaming,
    errors,
    videoConstraints,

    // 🔥 NEW: Flash State
    flashEnabled,
    hasFlash,

    // Actions
    startCamera,
    stopCamera,
    switchCamera,
    setVideoConstraints,

    // 🔥 NEW: Flash Actions
    toggleFlash,
  };
};
