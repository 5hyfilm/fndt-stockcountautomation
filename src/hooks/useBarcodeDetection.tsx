// src/hooks/useBarcodeDetection.tsx - Fixed version with improved barcode stability
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
import { findProductByBarcode, normalizeBarcode } from "../data/csvProducts";

export const useBarcodeDetection = () => {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null!);
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const containerRef = useRef<HTMLDivElement>(null!);
  const streamRef = useRef<MediaStream | null>(null);
  const productFetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastProcessedBarcodeRef = useRef<string>("");
  const processingBarcodeRef = useRef<string>("");

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

  // Product info state
  const [product, setProduct] = useState<Product | null>(null);
  const [detectedBarcodeType, setDetectedBarcodeType] = useState<
    "ea" | "dsp" | "cs" | null
  >(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);

  // Update barcode and fetch product info with better debouncing
  const updateBarcode = useCallback(async (barcode: string) => {
    const normalizedBarcode = normalizeBarcode(barcode);

    if (!normalizedBarcode) {
      return;
    }

    // ป้องกันการเรียกซ้ำด้วย barcode เดิม
    const lastProcessed = lastProcessedBarcodeRef.current;
    if (normalizedBarcode === lastProcessed) {
      console.log("🔄 Skipping duplicate barcode:", normalizedBarcode);
      return;
    }

    // ป้องกันการเรียกซ้อนทับ
    if (processingBarcodeRef.current === normalizedBarcode) {
      console.log("🔄 Already processing barcode:", normalizedBarcode);
      return;
    }

    // ยกเลิก timeout เก่า
    if (productFetchTimeoutRef.current) {
      clearTimeout(productFetchTimeoutRef.current);
      productFetchTimeoutRef.current = null;
    }

    console.log("🔄 New barcode detected:", {
      old: lastProcessed,
      new: normalizedBarcode,
    });

    // เซ็ต flag ว่ากำลังประมวลผล
    processingBarcodeRef.current = normalizedBarcode;
    setIsLoadingProduct(true);
    setProductError(null);

    try {
      // ใช้ findProductByBarcode ที่ return barcode type
      const result = await findProductByBarcode(normalizedBarcode);

      // ตรวจสอบว่ายังเป็น barcode เดิมอยู่หรือไม่ (ป้องกัน race condition)
      if (processingBarcodeRef.current !== normalizedBarcode) {
        console.log("🔄 Barcode changed during processing, skipping result");
        return;
      }

      if (result) {
        setProduct(result.product);
        setDetectedBarcodeType(result.barcodeType);
        setLastDetectedCode(normalizedBarcode);
        lastProcessedBarcodeRef.current = normalizedBarcode;
        setProductError(null);

        console.log(
          `✅ Product found: ${
            result.product.name
          } (${result.barcodeType.toUpperCase()})`
        );
      } else {
        setProduct(null);
        setDetectedBarcodeType(null);
        setProductError("ไม่พบข้อมูลสินค้าในระบบ");
        console.log("❌ Product not found for barcode:", normalizedBarcode);

        // อัพเดต lastDetectedCode แม้ไม่พบสินค้า เพื่อแสดง barcode ที่สแกน
        setLastDetectedCode(normalizedBarcode);
        lastProcessedBarcodeRef.current = normalizedBarcode;
      }
    } catch (error: any) {
      console.error("❌ Error fetching product:", error);

      // ตรวจสอบว่ายังเป็น barcode เดิมอยู่หรือไม่
      if (processingBarcodeRef.current === normalizedBarcode) {
        setProduct(null);
        setDetectedBarcodeType(null);
        setProductError(error.message || "เกิดข้อผิดพลาดในการค้นหาสินค้า");
        setLastDetectedCode(normalizedBarcode);
        lastProcessedBarcodeRef.current = normalizedBarcode;
      }
    } finally {
      // ล้าง processing flag เฉพาะเมื่อเป็น barcode เดิม
      if (processingBarcodeRef.current === normalizedBarcode) {
        processingBarcodeRef.current = "";
        setIsLoadingProduct(false);
      }
    }
  }, []);

  // Debounced update barcode function
  const debouncedUpdateBarcode = useCallback(
    (barcode: string) => {
      if (productFetchTimeoutRef.current) {
        clearTimeout(productFetchTimeoutRef.current);
      }

      productFetchTimeoutRef.current = setTimeout(() => {
        updateBarcode(barcode);
      }, 500); // Debounce 500ms
    },
    [updateBarcode]
  );

  // Clear error
  const clearError = useCallback(() => {
    setErrors(null);
    setProductError(null);
  }, []);

  // Clear product
  const clearProduct = useCallback(() => {
    setProduct(null);
    setDetectedBarcodeType(null);
    setProductError(null);
    setLastDetectedCode("");
    lastProcessedBarcodeRef.current = "";
    processingBarcodeRef.current = "";

    if (productFetchTimeoutRef.current) {
      clearTimeout(productFetchTimeoutRef.current);
      productFetchTimeoutRef.current = null;
    }
  }, []);

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

    // ล้างข้อมูล barcode ที่เก็บไว้
    lastProcessedBarcodeRef.current = "";
    processingBarcodeRef.current = "";
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
      ctx.strokeStyle = product ? "#10B981" : "#EF4444";
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);

      // Draw confidence label
      ctx.fillStyle = product ? "#10B981" : "#EF4444";
      ctx.font = "bold 14px Arial";
      const confidence = `${(detection.confidence * 100).toFixed(1)}%`;
      ctx.fillText(confidence, x, y - 8);

      // Draw barcode type if available
      if (product && detectedBarcodeType) {
        ctx.fillStyle = "#059669";
        ctx.font = "10px Arial";
        const typeText = `${detectedBarcodeType.toUpperCase()}`;
        ctx.fillText(typeText, x + width - 30, y - 8);
      }

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
  }, [detections, product, detectedBarcodeType]);

  // Capture and process frame with improved barcode stability
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

          // ใช้ debounced function แทนการเรียกตรงๆ
          if (barcodeData) {
            console.log("🔍 Barcode detected from API:", barcodeData);
            debouncedUpdateBarcode(barcodeData);
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
  }, [processingQueue, debouncedUpdateBarcode]);

  // Manual scan function for inventory tab
  const manualScan = useCallback(async () => {
    if (!isStreaming) {
      await startCamera();
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

      if (productFetchTimeoutRef.current) {
        clearTimeout(productFetchTimeoutRef.current);
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
    detectedBarcodeType,
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
    clearProduct,
    updateBarcode,
  };
};
