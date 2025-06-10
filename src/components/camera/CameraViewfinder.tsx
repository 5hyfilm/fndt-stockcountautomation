// src/components/camera/CameraViewfinder.tsx
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
}

export const CameraViewfinder: React.FC<CameraViewfinderProps> = ({
  videoRef,
  canvasRef,
  containerRef,
  isStreaming,
  detections,
  onLoadedMetadata,
}) => {
  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ aspectRatio: "16/9" }}
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

      {/* Camera Guide Frame */}
      <CameraGuideFrame />

      {/* Detection Indicator */}
      <DetectionIndicator detections={detections} isStreaming={isStreaming} />

      {/* Camera Off Overlay */}
      {!isStreaming && <CameraOffOverlay />}
    </div>
  );
};
