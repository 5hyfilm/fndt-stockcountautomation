// src/components/camera/CameraHeader.tsx
"use client";

import React from "react";
import { Camera, Wifi, WifiOff } from "lucide-react";
import { ControlButtons } from "../ControlButtons";

interface CameraHeaderProps {
  isStreaming: boolean;
  processingQueue: number;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onSwitchCamera: () => void;
  onCaptureAndProcess: () => void;
}

interface CameraStatusBadgeProps {
  isStreaming: boolean;
}

// Compact status indicator for mobile
export const CameraStatusBadge: React.FC<CameraStatusBadgeProps> = ({
  isStreaming,
}) => {
  return (
    <div className="flex items-center gap-1">
      {isStreaming ? (
        <Wifi className="text-green-500" size={14} />
      ) : (
        <WifiOff className="text-red-500" size={14} />
      )}
      <span
        className={`text-xs font-medium ${
          isStreaming ? "text-green-600" : "text-red-600"
        }`}
      >
        {isStreaming ? "ON" : "OFF"}
      </span>
    </div>
  );
};

export const CameraHeader: React.FC<CameraHeaderProps> = ({
  isStreaming,
  processingQueue,
  onStartCamera,
  onStopCamera,
  onSwitchCamera,
  onCaptureAndProcess,
}) => {
  return (
    <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
      {/* Left side - Compact icon and status */}
      <div className="flex items-center gap-2">
        <div className="bg-fn-green/10 p-1.5 rounded-md border border-fn-green/20">
          <Camera className="text-fn-green" size={16} />
        </div>
        <div className="flex flex-col">
          <h2 className="text-sm font-semibold text-gray-900">กล้อง</h2>
          <CameraStatusBadge isStreaming={isStreaming} />
        </div>
      </div>

      {/* Right side - Control buttons */}
      <ControlButtons
        isStreaming={isStreaming}
        processingQueue={processingQueue}
        startCamera={onStartCamera}
        stopCamera={onStopCamera}
        switchCamera={onSwitchCamera}
        captureAndProcess={onCaptureAndProcess}
        compact={true} // Enable compact mode for mobile
      />
    </div>
  );
};
