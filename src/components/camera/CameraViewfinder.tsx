// src/components/camera/CameraViewfinder.tsx - Enhanced with Mobile Optimizations
"use client";

import React from "react";
import { Detection } from "../../types/detection";
import { CameraGuideFrame } from "./CameraGuideFrame";
import { DetectionIndicator } from "./DetectionIndicator";
import { CameraOffOverlay } from "./CameraOffOverlay";

interface CameraViewfinderProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  containerRef: React.RefObject<HTMLDivElement>;
  isStreaming: boolean;
  detections: Detection[];
  onLoadedMetadata: () => void;
  cameraState?: "scanning" | "found" | "idle";
  isMobile?: boolean;
}

export const CameraViewfinder: React.FC<CameraViewfinderProps> = ({
  videoRef,
  canvasRef,
  containerRef,
  isStreaming,
  detections,
  onLoadedMetadata,
  cameraState = "idle",
  isMobile = false,
}) => {
  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ aspectRatio: isMobile ? "4/3" : "16/9" }}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        onLoadedMetadata={onLoadedMetadata}
      />

      {/* Detection Overlay Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
      />

      {/* Camera Guide Frame - Only show when actively scanning */}
      {isStreaming && cameraState === "scanning" && (
        <CameraGuideFrame isMobile={isMobile} />
      )}

      {/* Detection Indicator */}
      <DetectionIndicator
        detections={detections}
        isStreaming={isStreaming}
        cameraState={cameraState}
        isMobile={isMobile}
      />

      {/* Camera Off Overlay */}
      {!isStreaming && cameraState === "idle" && (
        <CameraOffOverlay isMobile={isMobile} />
      )}

      {/* Mobile: Scanning Animation Overlay */}
      {isMobile && isStreaming && cameraState === "scanning" && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Corner indicators */}
          <div className="absolute top-4 left-4 w-8 h-8 border-l-3 border-t-3 border-fn-green rounded-tl-lg animate-pulse"></div>
          <div className="absolute top-4 right-4 w-8 h-8 border-r-3 border-t-3 border-fn-green rounded-tr-lg animate-pulse"></div>
          <div className="absolute bottom-4 left-4 w-8 h-8 border-l-3 border-b-3 border-fn-green rounded-bl-lg animate-pulse"></div>
          <div className="absolute bottom-4 right-4 w-8 h-8 border-r-3 border-b-3 border-fn-green rounded-br-lg animate-pulse"></div>

          {/* Center scanning line */}
          <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2">
            <div className="h-0.5 bg-gradient-to-r from-transparent via-fn-green to-transparent animate-pulse opacity-70"></div>
          </div>
        </div>
      )}

      {/* Mobile: Success State Animation */}
      {isMobile && cameraState === "found" && (
        <div className="absolute inset-0 bg-green-500/20 pointer-events-none">
          <div className="absolute inset-4 border-2 border-green-500 rounded-lg animate-pulse">
            <div className="absolute inset-0 bg-green-500/10 rounded-lg"></div>
          </div>
        </div>
      )}

      {/* Mobile: Bottom instruction text */}
      {isMobile && isStreaming && cameraState === "scanning" && (
        <div className="absolute bottom-6 left-4 right-4">
          <div className="bg-black/60 text-white text-center py-2 px-4 rounded-lg backdrop-blur-sm">
            <p className="text-sm font-medium">วางบาร์โค้ดในกรอบเพื่อสแกน</p>
          </div>
        </div>
      )}
    </div>
  );
};
