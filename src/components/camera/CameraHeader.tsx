// src/components/camera/CameraHeader.tsx
"use client";

import React from "react";
import { Camera } from "lucide-react";
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

// Export CameraStatusBadge component
export const CameraStatusBadge: React.FC<CameraStatusBadgeProps> = ({
  isStreaming,
}) => {
  return (
    <p className="text-xs text-gray-600 flex items-center gap-1">
      <span
        className={`w-2 h-2 rounded-full ${
          isStreaming ? "bg-green-500" : "bg-red-500"
        }`}
      ></span>
      {isStreaming ? "กำลังทำงาน" : "หยุดทำงาน"}
    </p>
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
    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="bg-fn-green/10 p-2 rounded-lg border border-fn-green/20">
          <Camera className="fn-green" size={20} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">กล้องตรวจจับ</h2>
          <CameraStatusBadge isStreaming={isStreaming} />
        </div>
      </div>

      <ControlButtons
        isStreaming={isStreaming}
        processingQueue={processingQueue}
        startCamera={onStartCamera}
        stopCamera={onStopCamera}
        switchCamera={onSwitchCamera}
        captureAndProcess={onCaptureAndProcess}
      />
    </div>
  );
};
