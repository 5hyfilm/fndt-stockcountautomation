// src/components/CameraSection.tsx - Enhanced with Auto-Stop Feature
"use client";

import React, { useEffect, useState } from "react";
import { Detection } from "../types/detection";
import { CameraHeader } from "./camera/CameraHeader";
import { CameraViewfinder } from "./camera/CameraViewfinder";
import { CheckCircle, RotateCcw } from "lucide-react";

interface CameraSectionProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  containerRef: React.RefObject<HTMLDivElement>;
  isStreaming: boolean;
  processingQueue: number;
  detections: Detection[];
  startCamera: () => void;
  stopCamera: () => void;
  switchCamera: () => void;
  captureAndProcess: () => void;
  drawDetections: () => void;
  updateCanvasSize: () => void;
  // New props for enhancement
  product?: any;
  isMobile?: boolean;
  cameraState?: "scanning" | "found" | "idle";
}

export const CameraSection: React.FC<CameraSectionProps> = ({
  videoRef,
  canvasRef,
  containerRef,
  isStreaming,
  processingQueue,
  detections,
  startCamera,
  stopCamera,
  switchCamera,
  captureAndProcess,
  drawDetections,
  updateCanvasSize,
  product,
  isMobile = false,
  cameraState = "idle",
}) => {
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  // Show success overlay when product is found in mobile mode
  useEffect(() => {
    if (isMobile && product && cameraState === "found") {
      setShowSuccessOverlay(true);
      // Hide overlay after animation
      setTimeout(() => setShowSuccessOverlay(false), 2000);
    } else {
      setShowSuccessOverlay(false);
    }
  }, [isMobile, product, cameraState]);

  // Draw detections when detections change
  useEffect(() => {
    if (detections.length > 0) {
      drawDetections();
    }
  }, [detections, drawDetections]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      updateCanvasSize();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateCanvasSize]);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden relative">
      {/* Header Section */}
      <CameraHeader
        isStreaming={isStreaming}
        processingQueue={processingQueue}
        onStartCamera={startCamera}
        onStopCamera={stopCamera}
        onSwitchCamera={switchCamera}
        onCaptureAndProcess={captureAndProcess}
        cameraState={cameraState}
        isMobile={isMobile}
      />

      {/* Camera Viewfinder Section */}
      <div className="relative bg-gray-900">
        <CameraViewfinder
          videoRef={videoRef}
          canvasRef={canvasRef}
          containerRef={containerRef}
          isStreaming={isStreaming}
          detections={detections}
          onLoadedMetadata={updateCanvasSize}
          cameraState={cameraState}
          isMobile={isMobile}
        />

        {/* Success Overlay for Mobile */}
        {isMobile && showSuccessOverlay && (
          <div className="absolute inset-0 bg-green-500/90 flex items-center justify-center z-30 animate-pulse">
            <div className="text-center text-white">
              <CheckCircle size={64} className="mx-auto mb-4" />
              <p className="text-xl font-semibold">พบสินค้าแล้ว!</p>
              <p className="text-sm mt-2">กำลังหยุดกล้อง...</p>
            </div>
          </div>
        )}

        {/* Camera Stopped State for Mobile */}
        {isMobile && !isStreaming && cameraState === "found" && product && (
          <div className="absolute inset-0 bg-gray-800/95 flex items-center justify-center z-20">
            <div className="text-center text-white max-w-sm mx-auto p-6">
              <CheckCircle size={48} className="mx-auto mb-4 text-green-400" />
              <h3 className="text-lg font-semibold mb-2">สแกนเสร็จแล้ว</h3>
              <p className="text-sm text-gray-300 mb-4">
                พบสินค้า: {product.name}
              </p>
              <button
                onClick={startCamera}
                className="bg-fn-green text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 mx-auto hover:bg-fn-green/90 transition-colors"
              >
                <RotateCcw size={16} />
                สแกนใหม่
              </button>
            </div>
          </div>
        )}

        {/* Scanning State Indicator for Mobile */}
        {isMobile && isStreaming && cameraState === "scanning" && (
          <div className="absolute top-4 left-4 right-4 z-20">
            <div className="bg-black/50 text-white px-4 py-2 rounded-lg text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">กำลังสแกน...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
