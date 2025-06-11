// src/components/CameraSection.tsx - Refactored Main Component
"use client";

import React, { useEffect } from "react";
import { Detection } from "../types/detection";
import { CameraHeader } from "./camera/CameraHeader";
import { CameraViewfinder } from "./camera/CameraViewfinder";

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
}) => {
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
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header Section */}
      <CameraHeader
        isStreaming={isStreaming}
        processingQueue={processingQueue}
        onStartCamera={startCamera}
        onStopCamera={stopCamera}
        onSwitchCamera={switchCamera}
        onCaptureAndProcess={captureAndProcess}
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
        />
      </div>
    </div>
  );
};
