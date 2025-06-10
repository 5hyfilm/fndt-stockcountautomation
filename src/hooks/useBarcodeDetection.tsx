// src/hooks/useBarcodeDetection.tsx - Updated with Inventory Integration
"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import {
  Detection,
  Stats,
  VideoConstraints,
  BarcodeData,
  APIResponse,
} from "../types/detection";
import { Product } from "../types/product";
import { useProductInfo } from "./useProductInfo";

export const useBarcodeDetection = () => {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null!);
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const containerRef = useRef<HTMLDivElement>(null!);
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

  // Product info hook
  const {
    product,
    isLoading: isLoadingProduct,
    error: productError,
    updateBarcode,
    clearProduct,
    clearError: clearProductError,
  } = useProductInfo();

  // Clear error
  const clearError = useCallback(() => {
    setErrors(null);
    clearProductError();
  }, [clearProductError]);

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

    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }

    setIsStreaming(false);
    setDetections([]);
    setProcessingQueue(0);
    // Don't clear lastDetectedCode to maintain product info
    // setLastDetectedCode("");
    // clearProduct();
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

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const containerRect = canvas.getBoundingClientRect();
    const videoWidth = video.videoWidth || 1;
    const videoHeight = video.videoHeight || 1;

    const scaleX = containerRect.width / videoWidth;
    const scaleY = containerRect.height / videoHeight;

    detections.forEach((detection) => {
      const x = detection.xmin * scaleX;
      const y = detection.ymin * scaleY;
      const width = (detection.xmax - detection.xmin) * scaleX;
      const height = (detection.ymax - detection.ymin) * scaleY;

      // Draw detection box with enhanced styling
      ctx.strokeStyle = product ? "#10B981" : "#EF4444"; // Green if product found, red if not
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);

      // Draw confidence label
      ctx.fillStyle = product ? "#10B981" : "#EF4444";
      ctx.font = "bold 14px Arial";
      const confidence = `${(detection.confidence * 100).toFixed(1)}%`;
      ctx.fillText(confidence, x, y - 8);

      // Draw product name if available
      if (product) {
        ctx.fillStyle = "#059669";
        ctx.font = "12px Arial";
        const maxWidth = width - 10;
        const productName =
          product.name.length > 20
            ? product.name.substring(0, 20) + "..."
            : product.name;
        ctx.fillText(productName, x + 5, y + height - 8, maxWidth);
      }

      // Enhanced corner markers
      const markerSize = 15;
      ctx.fillStyle = product ? "#10B981" : "#EF4444";

      // Top-left
      ctx.fillRect(x - 2, y - 2, markerSize, 3);
      ctx.fillRect(x - 2, y - 2, 3, markerSize);

      // Top-right
      ctx.fillRect(x + width - markerSize + 2, y - 2, markerSize, 3);
      ctx.fillRect(x + width - 1, y - 2, 3, markerSize);

      // Bottom-left
      ctx.fillRect(x - 2, y + height - 1, markerSize, 3);
      ctx.fillRect(x - 2, y + height - markerSize + 2, 3, markerSize);

      // Bottom-right
      ctx.fillRect(x + width - markerSize + 2, y + height - 1, markerSize, 3);
      ctx.fillRect(x + width - 1, y + height - markerSize + 2, 3, markerSize);
    });
  }, [detections, product]);

  // Capture and process frame
  const captureAndProcess = useCallback(async () => {
    const video = videoRef.current;
    if (!video || processingQueue >= 3) return;

    try {
      setProcessingQueue((prev) => prev + 1);
      const startTime = Date.now();

      const captureCanvas = document.createElement("canvas");
      const ctx = captureCanvas.getContext("2d");

      if (!ctx) return;

      captureCanvas.width = video.videoWidth || 640;
      captureCanvas.height = video.videoHeight || 480;

      ctx.drawImage(video, 0, 0);

      const blob = await new Promise<Blob>((resolve, reject) => {
        captureCanvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Failed to create blob"));
            }
          },
          "image/jpeg",
          0.8
        );
      });

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
          const barcodeData = latestBarcode.data;

          // Only update if it's a new barcode to prevent unnecessary API calls
          if (barcodeData && barcodeData !== lastDetectedCode) {
            setLastDetectedCode(barcodeData);
            console.log(
              "🔍 New barcode detected, fetching product info:",
              barcodeData
            );
            updateBarcode(barcodeData);
          }
        }

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
  }, [processingQueue, lastDetectedCode, updateBarcode]);

  // Manual scan function for inventory tab
  const manualScan = useCallback(async () => {
    if (!isStreaming) {
      await startCamera();
      // Wait a bit for camera to start
      setTimeout(() => {
        captureAndProcess();
      }, 1000);
    } else {
      await captureAndProcess();
    }
  }, [isStreaming, startCamera, captureAndProcess]);

  // Force rescan current view
  const rescanCurrentView = useCallback(async () => {
    if (isStreaming) {
      await captureAndProcess();
    }
  }, [isStreaming, captureAndProcess]);

  // Clear current detection
  const clearCurrentDetection = useCallback(() => {
    setLastDetectedCode("");
    setDetections([]);
    clearProduct();
  }, [clearProduct]);

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

    // Product info
    product,
    isLoadingProduct,
    productError,

    // Actions
    startCamera,
    stopCamera,
    switchCamera,
    captureAndProcess,
    manualScan,
    rescanCurrentView,
    clearCurrentDetection,
    drawDetections,
    updateCanvasSize,
    clearError,
  };
};
