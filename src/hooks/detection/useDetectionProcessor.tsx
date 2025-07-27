// src/hooks/detection/useDetectionProcessor.tsx
"use client";

import { useState, useCallback } from "react";
import {
  Detection,
  Stats,
  APIResponse,
  UseDetectionProcessorProps,
  UseDetectionProcessorReturn,
} from "../../types/detection";

export const useDetectionProcessor = ({
  videoRef,
  lastDetectedCode,
  updateBarcode,
}: UseDetectionProcessorProps): UseDetectionProcessorReturn => {
  // State
  const [detections, setDetections] = useState<Detection[]>([]);
  const [processingQueue, setProcessingQueue] = useState(0);
  const [stats, setStats] = useState<Stats>({
    rotation: 0,
    method: "",
    confidence: 0,
    fps: 0,
    lastProcessTime: 0,
  });

  // Capture and process frame
  const captureAndProcess = useCallback(async () => {
    const video = videoRef.current;
    if (!video || processingQueue >= 3) return;

    try {
      setProcessingQueue((prev) => prev + 1);
      const startTime = performance.now();

      // Create canvas and capture frame
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("ไม่สามารถสร้าง canvas context ได้");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("ไม่สามารถแปลงเป็น blob ได้"));
          },
          "image/jpeg",
          0.8
        );
      });

      // Prepare FormData
      const formData = new FormData();
      formData.append("image", blob, "frame.jpg");

      // Send to API
      const response = await fetch("/api/detect-barcode", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const result: APIResponse = await response.json();
      const processingTime = performance.now() - startTime;

      // Update stats
      setStats({
        rotation: result.rotation_angle || 0,
        method: result.decode_method || "unknown",
        confidence: result.confidence || 0,
        fps: Math.round(1000 / processingTime),
        lastProcessTime: processingTime,
      });

      // Update detections
      if (result.detections) {
        setDetections(result.detections);
      }

      // Handle barcode detection
      if (result.success && result.barcodes && result.barcodes.length > 0) {
        const barcode = result.barcodes[0];
        if (barcode.data !== lastDetectedCode) {
          await updateBarcode(barcode.data);
        }
      }
    } catch (error) {
      console.error("Detection error:", error);
      setStats((prev) => ({ ...prev, fps: 0, lastProcessTime: 0 }));
    } finally {
      setProcessingQueue((prev) => Math.max(0, prev - 1));
    }
  }, [videoRef, processingQueue, lastDetectedCode, updateBarcode]);

  // Reset detections
  const resetDetections = useCallback(() => {
    setDetections([]);
    setStats({
      rotation: 0,
      method: "",
      confidence: 0,
      fps: 0,
      lastProcessTime: 0,
    });
  }, []);

  // Update stats function
  const updateStats = useCallback((newStats: Partial<Stats>) => {
    setStats((prev) => ({ ...prev, ...newStats }));
  }, []);

  return {
    // State
    detections,
    processingQueue,
    lastDetectedCode,
    stats,
    isProcessing: processingQueue > 0,

    // Actions
    captureAndProcess,
    resetDetections,
    updateStats,
  };
};
