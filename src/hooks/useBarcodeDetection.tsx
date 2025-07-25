// src/hooks/useBarcodeDetection.tsx
// 🎯 Main barcode detection hook with consolidated types

"use client";

import { useCallback } from "react";
import { useCameraControl } from "./camera/useCameraControl";
import { useProductLookup } from "./product/useProductLookup";
import { useDetectionProcessor } from "./detection/useDetectionProcessor";
import { useCanvasRenderer } from "./canvas/useCanvasRenderer";
import type { UseBarcodeDetectionReturn } from "./types"; // ✅ Import from consolidated types

// =========================================
// 🪝 Main Barcode Detection Hook
// =========================================

export const useBarcodeDetection = (): UseBarcodeDetectionReturn => {
  // =========================================
  // 🎥 Camera Control
  // =========================================

  const camera = useCameraControl();

  // =========================================
  // 🛒 Product Lookup with Callback
  // =========================================

  // 🔥 Create callback for when product is found
  const handleProductFound = useCallback(() => {
    console.log("🎯 Product found! Stopping camera...");
    camera.stopCamera();
  }, [camera]);

  // Pass callback to productLookup
  const productLookup = useProductLookup({
    onProductFound: handleProductFound,
  });

  // =========================================
  // 🎨 Canvas Rendering
  // =========================================

  const canvas = useCanvasRenderer();

  // =========================================
  // 🔍 Detection Processing
  // =========================================

  const detection = useDetectionProcessor({
    videoRef: camera.videoRef,
    lastDetectedCode: productLookup.lastDetectedCode,
    updateBarcode: productLookup.updateBarcode,
  });

  // =========================================
  // 🎛️ Combined Actions
  // =========================================

  // Combined error handling
  const clearError = useCallback(() => {
    // Clear product data and reset detection
    productLookup.clearProduct();
  }, [productLookup]);

  // Enhanced draw detections with all required params
  const drawDetections = useCallback(() => {
    canvas.drawDetections(
      detection.detections,
      productLookup.product,
      productLookup.detectedBarcodeType,
      camera.videoRef
    );
  }, [
    canvas,
    detection.detections,
    productLookup.product,
    productLookup.detectedBarcodeType,
    camera.videoRef,
  ]);

  // Manual scan function for inventory tab
  const manualScan = useCallback(async () => {
    if (!camera.isStreaming) {
      await camera.startCamera();
      setTimeout(() => {
        detection.captureAndProcess();
      }, 1000);
    } else {
      await detection.captureAndProcess();
    }
  }, [camera, detection]);

  // Force rescan current view
  const rescanCurrentView = useCallback(async () => {
    if (camera.isStreaming) {
      await detection.captureAndProcess();
    }
  }, [camera, detection]);

  // Enhanced stop camera that resets everything
  const stopCamera = useCallback(() => {
    camera.stopCamera();
    detection.resetDetections();
  }, [camera, detection]);

  // 🔄 Restart for next scan (clear everything and prepare for next scan)
  const restartForNextScan = useCallback(() => {
    console.log("🔄 Restarting for next scan...");
    productLookup.clearCurrentDetection();
    detection.resetDetections();
    // Don't auto-start camera - let user start manually
  }, [productLookup, detection]);

  // =========================================
  // 📤 Return Combined Interface
  // =========================================

  return {
    // 📚 Refs (from camera and canvas)
    videoRef: camera.videoRef,
    canvasRef: canvas.canvasRef,
    containerRef: canvas.containerRef,

    // 🎥 Camera state and actions
    isStreaming: camera.isStreaming,
    videoConstraints: camera.videoConstraints,
    startCamera: camera.startCamera,
    stopCamera,
    switchCamera: camera.switchCamera,
    setVideoConstraints: camera.setVideoConstraints,

    // 🔦 Torch control (if available)
    torchOn: camera.torchOn,
    toggleTorch: camera.toggleTorch,

    // 🔍 Detection state and actions
    detections: detection.detections,
    processingQueue: detection.processingQueue,
    stats: detection.stats,
    captureAndProcess: detection.captureAndProcess,
    resetDetections: detection.resetDetections,

    // 🛒 Product lookup state (✅ Fixed property names)
    product: productLookup.product,
    detectedBarcodeType: productLookup.detectedBarcodeType, // "ea" | "dsp" | "cs" | null
    isLoadingProduct: productLookup.isLoadingProduct, // ✅ Fixed name
    productError: productLookup.productError, // ✅ Fixed name
    lastDetectedCode: productLookup.lastDetectedCode, // ✅ From productLookup, not detection

    // 🎨 Canvas actions
    drawDetections,
    updateCanvasSize: canvas.updateCanvasSize,

    // 🎛️ Enhanced actions
    manualScan,
    rescanCurrentView,
    restartForNextScan,

    // 🚨 Combined error handling
    errors: camera.errors || productLookup.productError, // ✅ Fixed property name
    clearError,
  };
};
