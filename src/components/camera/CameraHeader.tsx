// Path: /src/components/camera/CameraHeader.tsx
"use client";

import React from "react";
import { Camera, CameraOff, RotateCcw, Scan, Flashlight } from "lucide-react";

// 🔥 UPDATED: Interface with flash properties
interface CameraHeaderProps {
  isStreaming: boolean;
  processingQueue: number;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onSwitchCamera: () => void;
  onCaptureAndProcess: () => void;
  compact?: boolean; // New prop for compact mode
  transparent?: boolean; // New prop for transparent background

  // 🔥 NEW: Flash properties
  hasFlash: boolean;
  flashEnabled: boolean;
  onToggleFlash: () => void;
}

export const CameraStatusBadge: React.FC<{
  isStreaming: boolean;
  processingQueue: number;
  compact?: boolean;
}> = ({ isStreaming, processingQueue, compact = false }) => {
  if (processingQueue > 0) {
    return (
      <div
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 ${
          compact ? "text-xs" : "text-sm"
        }`}
      >
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
        ประมวลผล ({processingQueue})
      </div>
    );
  }

  if (isStreaming) {
    return (
      <div
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-800 ${
          compact ? "text-xs" : "text-sm"
        }`}
      >
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        กำลังทำงาน
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-600 ${
        compact ? "text-xs" : "text-sm"
      }`}
    >
      <div className="w-2 h-2 bg-gray-400 rounded-full" />
      ปิดกล้อง
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
  compact = false,
  transparent = false,

  // 🔥 NEW: Flash props
  hasFlash,
  flashEnabled,
  onToggleFlash,
}) => {
  // Dynamic styles based on props
  const headerClasses = `
    ${compact ? "px-3 py-2" : "px-4 py-3"}
    ${transparent ? "bg-transparent" : "bg-gray-50 border-b border-gray-200"}
    flex items-center justify-between
  `;

  const buttonSize = compact ? "p-1.5" : "p-2";
  const iconSize = compact ? 16 : 20;

  return (
    <div className={headerClasses}>
      {/* Title and Status */}
      <div className="flex items-center gap-3">
        <h3
          className={`${compact ? "text-sm" : "text-lg"} font-semibold ${
            transparent ? "text-white" : "text-gray-900"
          } flex items-center gap-2`}
        >
          <Camera size={compact ? 16 : 20} />
          สแกนบาร์โค้ด
        </h3>
        <CameraStatusBadge
          isStreaming={isStreaming}
          processingQueue={processingQueue}
          compact={compact}
        />
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-2">
        {/* Start/Stop Camera */}
        {isStreaming ? (
          <button
            onClick={onStopCamera}
            className={`${buttonSize} ${
              transparent
                ? "bg-white/20 hover:bg-white/30 text-white"
                : "bg-red-100 hover:bg-red-200 text-red-700"
            } rounded-lg transition-colors`}
            title="หยุดกล้อง"
          >
            <CameraOff size={iconSize} />
          </button>
        ) : (
          <button
            onClick={onStartCamera}
            className={`${buttonSize} ${
              transparent
                ? "bg-white/20 hover:bg-white/30 text-white"
                : "bg-green-100 hover:bg-green-200 text-green-700"
            } rounded-lg transition-colors`}
            title="เปิดกล้อง"
          >
            <Camera size={iconSize} />
          </button>
        )}

        {/* Switch Camera (only when streaming) */}
        {isStreaming && (
          <button
            onClick={onSwitchCamera}
            className={`${buttonSize} ${
              transparent
                ? "bg-white/20 hover:bg-white/30 text-white"
                : "bg-blue-100 hover:bg-blue-200 text-blue-700"
            } rounded-lg transition-colors`}
            title="สลับกล้อง"
          >
            <RotateCcw size={iconSize} />
          </button>
        )}

        {/* 🔥 NEW: Flash Toggle Button (only when streaming and device supports flash) */}
        {isStreaming && hasFlash && (
          <button
            onClick={onToggleFlash}
            className={`${buttonSize} ${
              flashEnabled
                ? transparent
                  ? "bg-yellow-500/80 hover:bg-yellow-600/80 text-white"
                  : "bg-yellow-500 hover:bg-yellow-600 text-white"
                : transparent
                ? "bg-white/20 hover:bg-white/30 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            } rounded-lg transition-colors`}
            title={flashEnabled ? "ปิดไฟฉาย" : "เปิดไฟฉาย"}
          >
            <Flashlight size={iconSize} />
          </button>
        )}

        {/* Manual Capture (only when streaming) */}
        {isStreaming && (
          <button
            onClick={onCaptureAndProcess}
            disabled={processingQueue > 0}
            className={`${buttonSize} ${
              transparent
                ? "bg-white/20 hover:bg-white/30 text-white disabled:bg-white/10"
                : "bg-purple-100 hover:bg-purple-200 text-purple-700 disabled:bg-gray-100 disabled:text-gray-400"
            } rounded-lg transition-colors`}
            title="สแกนด้วยตนเอง"
          >
            <Scan size={iconSize} />
          </button>
        )}
      </div>
    </div>
  );
};
