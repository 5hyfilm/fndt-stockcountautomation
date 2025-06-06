"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import {
  Detection,
  Stats,
  VideoConstraints,
  BarcodeData,
  APIResponse,
} from "../types/detection";

export const useBarcodeDetection = () => {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // State
  const [isStreaming, setIsStreaming] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [processingQueue, setProcessingQueue] = useState(0);
  const [lastDetectedCode, setLastDetectedCode] = useState<string>("");
  const [errors, setErrors] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({
    rotation: 0,
    method: "",
    confidence: 0,
    fps: 0,
    lastProcessTime: 0,
  });
  const [videoConstraints, setVideoConstraints] = useState<VideoConstraints>({
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: "environment",
  });

  // Clear error
  const clearError = useCallback(() => {
    setErrors(null);
  }, []);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setErrors(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);

        // Wait for video to load
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => resolve(true);
          }
        });

        updateCanvasSize();
      }
    } catch (error: any) {
      console.error("Error starting camera:", error);
      setErrors(
        error.name === "NotAllowedError"
          ? "กรุณาอนุญาตการใช้งานกล้อง"
          : error.name === "NotFoundError"
          ? "ไม่พบกล้องในอุปกรณ์"
          : `เกิดข้อผิดพลาด: ${error.message}`
      );
    }
  }, [videoConstraints]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsStreaming(false);
    setDetections([]);
    setProcessingQueue(0);
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

  // Update canvas size
  const updateCanvasSize = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (video && canvas && container) {
      const containerRect = container.getBoundingClientRect();
      canvas.width = containerRect.width;
      canvas.height = containerRect.height;
    }
  }, []);

  // Draw detections on canvas
  const drawDetections = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video || detections.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Get video dimensions
    const videoRect = video.getBoundingClientRect();
    const containerRect = canvas.getBoundingClientRect();

    const scaleX = containerRect.width / video.videoWidth;
    const scaleY = containerRect.height / video.videoHeight;

    // Draw detection boxes
    detections.forEach((detection, index) => {
      const x = detection.xmin * scaleX;
      const y = detection.ymin * scaleY;
      const width = (detection.xmax - detection.xmin) * scaleX;
      const height = (detection.ymax - detection.ymin) * scaleY;

      // Draw bounding box
      ctx.strokeStyle = "#00ff00";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);

      // Draw confidence label
      ctx.fillStyle = "#00ff00";
      ctx.font = "12px Arial";
      ctx.fillText(`${(detection.confidence * 100).toFixed(1)}%`, x, y - 5);

      // Draw corner markers
      const markerSize = 10;
      ctx.fillStyle = "#00ff00";

      // Top-left
      ctx.fillRect(x - 1, y - 1, markerSize, 2);
      ctx.fillRect(x - 1, y - 1, 2, markerSize);

      // Top-right
      ctx.fillRect(x + width - markerSize + 1, y - 1, markerSize, 2);
      ctx.fillRect(x + width - 1, y - 1, 2, markerSize);

      // Bottom-left
      ctx.fillRect(x - 1, y + height - 1, markerSize, 2);
      ctx.fillRect(x - 1, y + height - markerSize + 1, 2, markerSize);

      // Bottom-right
      ctx.fillRect(x + width - markerSize + 1, y + height - 1, markerSize, 2);
      ctx.fillRect(x + width - 1, y + height - markerSize + 1, 2, markerSize);
    });
  }, [detections]);

  // Capture and process frame
  const captureAndProcess = useCallback(async () => {
    if (!videoRef.current || processingQueue >= 3) return;

    try {
      setProcessingQueue((prev) => prev + 1);
      const startTime = Date.now();

      // Create canvas for capture
      const captureCanvas = document.createElement("canvas");
      const ctx = captureCanvas.getContext("2d");

      if (!ctx) return;

      captureCanvas.width = videoRef.current.videoWidth;
      captureCanvas.height = videoRef.current.videoHeight;

      // Draw video frame to canvas
      ctx.drawImage(videoRef.current, 0, 0);

      // Convert to blob
      const blob = await new Promise<Blob>((resolve) => {
        captureCanvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
          },
          "image/jpeg",
          0.8
        );
      });

      // Send to API
      const formData = new FormData();
      formData.append("image", blob, "frame.jpg");

      const response = await fetch("/api/detect-barcode", {
        method: "POST",
        body: formData,
      });

      const result: APIResponse = await response.json();

      if (result.success) {
        if (result.detections) {
          setDetections(result.detections);
        }

        if (result.barcodes && result.barcodes.length > 0) {
          const latestBarcode = result.barcodes[0];
          setLastDetectedCode(latestBarcode.data);
        }

        // Update stats
        setStats({
          rotation: result.rotation_angle || 0,
          method: result.decode_method || "",
          confidence: result.confidence || 0,
          fps: Math.round(1000 / 300),
          lastProcessTime: Date.now() - startTime,
        });
      } else {
        console.error("Detection failed:", result.error);
      }
    } catch (error: any) {
      console.error("Error processing frame:", error);
      setErrors(`ข้อผิดพลาดในการประมวลผล: ${error.message}`);
    } finally {
      setProcessingQueue((prev) => Math.max(0, prev - 1));
    }
  }, [processingQueue]);

  // Auto-restart camera when constraints change
  useEffect(() => {
    if (isStreaming) {
      stopCamera();
      setTimeout(() => startCamera(), 100);
    }
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
    canvasRef,
    containerRef,

    // State
    isStreaming,
    detections,
    processingQueue,
    lastDetectedCode,
    stats,
    errors,
    videoConstraints,

    // Actions
    startCamera,
    stopCamera,
    switchCamera,
    captureAndProcess,
    drawDetections,
    updateCanvasSize,
    clearError,
  };
};
