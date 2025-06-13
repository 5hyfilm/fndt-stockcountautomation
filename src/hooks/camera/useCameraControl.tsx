// ./src/hooks/camera/useCameraControl.tsx
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
  }, [videoConstraints]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }

    setIsStreaming(false);
  }, []);

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

    // Actions
    startCamera,
    stopCamera,
    switchCamera,
    setVideoConstraints,
  };
};
