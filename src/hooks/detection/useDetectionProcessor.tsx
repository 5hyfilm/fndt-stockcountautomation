// src/hooks/detection/useDetectionProcessor.tsx - Enhanced with Auto-Stop Logic
"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Detection } from "../../types/detection";
import {
  detectBarcodesInImage,
  BarcodeDetectionResult,
} from "../../utils/barcodeDetection";

interface UseDetectionProcessorProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  lastDetectedCode: string | null;
  updateBarcode: (code: string, type?: string) => void;
  onProductFound?: (product: any) => void; // New callback for mobile auto-stop
  isMobile?: boolean;
  autoStopOnDetection?: boolean; // New prop to control auto-stop behavior
}

export const useDetectionProcessor = ({
  videoRef,
  lastDetectedCode,
  updateBarcode,
  onProductFound,
  isMobile = false,
  autoStopOnDetection = false,
}: UseDetectionProcessorProps) => {
  // State
  const [detections, setDetections] = useState<Detection[]>([]);
  const [processingQueue, setProcessingQueue] = useState(0);
  const [stats, setStats] = useState({
    totalDetections: 0,
    successfulDetections: 0,
    lastDetectionTime: null as Date | null,
  });

  // Refs
  const processingRef = useRef(false);
  const lastDetectionTimeRef = useRef<number>(0);
  const detectionCountRef = useRef(0);
  const autoStopTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Enhanced detection logic with mobile optimizations
  const captureAndProcess = useCallback(async () => {
    const video = videoRef.current;
    if (!video || processingRef.current || video.readyState !== 4) {
      return;
    }

    // Prevent rapid successive detections
    const now = Date.now();
    const timeSinceLastDetection = now - lastDetectionTimeRef.current;

    // For mobile, use longer debounce to prevent over-processing
    const debounceTime = isMobile ? 1000 : 500;
    if (timeSinceLastDetection < debounceTime) {
      return;
    }

    try {
      processingRef.current = true;
      setProcessingQueue((prev) => prev + 1);

      // Create canvas and capture frame
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) return;

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current video frame
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Detect barcodes in the captured frame
      const detectedBarcodes: BarcodeDetectionResult[] =
        await detectBarcodesInImage(canvas);

      if (detectedBarcodes.length > 0) {
        // Convert to Detection format
        const detections: Detection[] = detectedBarcodes.map(
          (barcode, index) => ({
            id: `detection_${now}_${index}`,
            rawValue: barcode.rawValue,
            format: barcode.format,
            timestamp: now,
            boundingBox: barcode.boundingBox,
            cornerPoints: barcode.cornerPoints,
            confidence: barcode.confidence || 0.8,
          })
        );
        // Update stats
        setStats((prev) => ({
          totalDetections: prev.totalDetections + 1,
          successfulDetections: prev.successfulDetections + 1,
          lastDetectionTime: new Date(),
        }));

        // Update detections for visual feedback
        setDetections(detections);

        const firstBarcode = detectedBarcodes[0];
        const barcodeValue = firstBarcode.rawValue;

        console.log("🎯 Barcode detected:", barcodeValue);
        console.log("📱 Mobile mode:", isMobile);
        console.log("🛑 Auto-stop enabled:", autoStopOnDetection);

        // Update the barcode value
        updateBarcode(barcodeValue, firstBarcode.format);

        // Mobile-specific behavior: Auto-stop after successful detection
        if (isMobile && autoStopOnDetection) {
          console.log("🛑 Mobile auto-stop triggered");

          // Clear any existing timeout
          if (autoStopTimeoutRef.current) {
            clearTimeout(autoStopTimeoutRef.current);
          }

          // Set timeout to trigger product found callback
          autoStopTimeoutRef.current = setTimeout(() => {
            if (onProductFound) {
              onProductFound(firstBarcode);
            }
          }, 300); // Small delay to allow for product lookup
        }

        lastDetectionTimeRef.current = now;
        detectionCountRef.current++;
      } else {
        // Update stats for failed detection
        setStats((prev) => ({
          ...prev,
          totalDetections: prev.totalDetections + 1,
        }));

        // Clear detections if none found
        setDetections([]);
      }
    } catch (error) {
      console.error("Error during barcode detection:", error);
      setDetections([]);
    } finally {
      processingRef.current = false;
      setProcessingQueue((prev) => Math.max(0, prev - 1));
    }
  }, [videoRef, updateBarcode, isMobile, autoStopOnDetection, onProductFound]);

  // Auto-processing for continuous scanning
  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    let animationFrame: number;
    let lastProcessTime = 0;

    const processFrame = () => {
      const now = performance.now();

      // Process at different intervals based on device type
      const processInterval = isMobile ? 2000 : 1500; // Mobile: every 2s, Desktop: every 1.5s

      if (now - lastProcessTime >= processInterval && !processingRef.current) {
        captureAndProcess();
        lastProcessTime = now;
      }

      animationFrame = requestAnimationFrame(processFrame);
    };

    // Start processing when video is playing
    const handleVideoPlay = () => {
      animationFrame = requestAnimationFrame(processFrame);
    };

    const handleVideoPause = () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };

    video.addEventListener("play", handleVideoPlay);
    video.addEventListener("pause", handleVideoPause);
    video.addEventListener("ended", handleVideoPause);

    // Start if video is already playing
    if (!video.paused && !video.ended) {
      handleVideoPlay();
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      video.removeEventListener("play", handleVideoPlay);
      video.removeEventListener("pause", handleVideoPause);
      video.removeEventListener("ended", handleVideoPause);

      // Clear auto-stop timeout
      if (autoStopTimeoutRef.current) {
        clearTimeout(autoStopTimeoutRef.current);
      }
    };
  }, [videoRef, captureAndProcess, isMobile]);

  // Reset detections when barcode changes
  useEffect(() => {
    if (lastDetectedCode) {
      // Keep detections visible for a short time after successful detection
      const timeout = setTimeout(
        () => {
          if (!processingRef.current) {
            setDetections([]);
          }
        },
        isMobile ? 2000 : 1000
      );

      return () => clearTimeout(timeout);
    }
  }, [lastDetectedCode, isMobile]);

  // Reset function
  const resetDetections = useCallback(() => {
    setDetections([]);
    setProcessingQueue(0);
    setStats({
      totalDetections: 0,
      successfulDetections: 0,
      lastDetectionTime: null,
    });
    detectionCountRef.current = 0;
    lastDetectionTimeRef.current = 0;

    // Clear auto-stop timeout
    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = null;
    }
  }, []);

  // Force detection (manual trigger)
  const forceDetection = useCallback(async () => {
    // Reset debounce to allow immediate detection
    lastDetectionTimeRef.current = 0;
    await captureAndProcess();
  }, [captureAndProcess]);

  return {
    detections,
    processingQueue,
    stats,
    captureAndProcess,
    resetDetections,
    forceDetection,
  };
};
