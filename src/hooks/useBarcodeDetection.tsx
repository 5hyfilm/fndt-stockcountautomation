// src/hooks/useBarcodeDetection.tsx - แก้ไข types
"use client";

import { useCallback } from "react";
import { useCameraControl } from "./camera/useCameraControl";
import { useProductLookup } from "./product/useProductLookup";
import { useDetectionProcessor } from "./detection/useDetectionProcessor";
import { useCanvasRenderer } from "./canvas/useCanvasRenderer";

export const useBarcodeDetection = () => {
  // Sub-hooks
  const camera = useCameraControl();
  const productLookup = useProductLookup();
  const canvas = useCanvasRenderer();

  const detection = useDetectionProcessor({
    videoRef: camera.videoRef,
    lastDetectedCode: productLookup.lastDetectedCode,
    updateBarcode: productLookup.updateBarcode,
  });

  // Combined error handling
  const clearError = useCallback(() => {
    // Clear camera errors through camera hook if needed
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
  }, [camera.isStreaming, camera.startCamera, detection.captureAndProcess]);

  // Force rescan current view
  const rescanCurrentView = useCallback(async () => {
    if (camera.isStreaming) {
      await detection.captureAndProcess();
    }
  }, [camera.isStreaming, detection.captureAndProcess]);

  // Enhanced stop camera that resets everything
  const stopCamera = useCallback(() => {
    camera.stopCamera();
    detection.resetDetections();
  }, [camera, detection]);

  return {
    // Refs (from camera and canvas)
    videoRef: camera.videoRef,
    canvasRef: canvas.canvasRef,
    containerRef: canvas.containerRef,

    // Camera state and actions
    isStreaming: camera.isStreaming,
    videoConstraints: camera.videoConstraints,
    startCamera: camera.startCamera,
    stopCamera,
    switchCamera: camera.switchCamera,

    // Detection state and actions
    detections: detection.detections,
    processingQueue: detection.processingQueue,
    stats: detection.stats,
    captureAndProcess: detection.captureAndProcess,

    // Product state and actions
    product: productLookup.product,
    detectedBarcodeType: productLookup.detectedBarcodeType,
    isLoadingProduct: productLookup.isLoadingProduct,
    productError: productLookup.productError,
    lastDetectedCode: productLookup.lastDetectedCode,
    updateBarcode: productLookup.updateBarcode,
    clearProduct: productLookup.clearProduct,
    clearCurrentDetection: productLookup.clearCurrentDetection,

    // Canvas actions
    drawDetections,
    updateCanvasSize: canvas.updateCanvasSize,

    // Combined actions
    errors: camera.errors || productLookup.productError,
    clearError,
    manualScan,
    rescanCurrentView,
  };
};
