// src/components/camera/CameraControls.tsx
"use client";

import React from "react";
import { Play, Pause, Zap, Settings, Flashlight } from "lucide-react";

interface CameraControlsProps {
  isStreaming: boolean;
  processingQueue: number;
  hasFlash: boolean;
  flashEnabled: boolean;
  resolution: string;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onSwitchCamera: () => void;
  onCapture: () => void;
  onToggleFlash?: () => void;
  onOpenSettings?: () => void;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  isStreaming,
  processingQueue,
  hasFlash,
  flashEnabled,
  resolution,
  onStartCamera,
  onStopCamera,
  onCapture,
  onToggleFlash,
  onOpenSettings,
}) => {
  return (
    <div className="flex flex-wrap justify-center sm:justify-end items-center gap-2">
      {/* Main Camera Control */}
      <CameraToggleButton
        isStreaming={isStreaming}
        onStart={onStartCamera}
        onStop={onStopCamera}
      />

      {/* Secondary Controls - only show when camera is active */}
      {isStreaming && (
        <>
          {hasFlash && onToggleFlash && (
            <FlashToggleButton enabled={flashEnabled} onClick={onToggleFlash} />
          )}

          <CaptureButton
            processingQueue={processingQueue}
            onClick={onCapture}
          />

          {onOpenSettings && <SettingsButton onClick={onOpenSettings} />}
        </>
      )}

      {/* Status Indicator */}
      <CameraStatusIndicator
        isStreaming={isStreaming}
        resolution={resolution}
        processingQueue={processingQueue}
      />
    </div>
  );
};

// src/components/camera/CameraToggleButton.tsx
interface CameraToggleButtonProps {
  isStreaming: boolean;
  onStart: () => void;
  onStop: () => void;
}

export const CameraToggleButton: React.FC<CameraToggleButtonProps> = ({
  isStreaming,
  onStart,
  onStop,
}) => {
  if (!isStreaming) {
    return (
      <button
        onClick={onStart}
        className="bg-fn-green hover:bg-fn-green/90 text-white px-3 py-2 sm:px-4 rounded-lg flex items-center gap-2 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105 border border-fn-green"
      >
        <Play size={16} />
        <span className="hidden xs:inline">เริ่ม</span>
      </button>
    );
  }

  return (
    <button
      onClick={onStop}
      className="bg-fn-red hover:bg-fn-red/90 text-white px-3 py-2 sm:px-4 rounded-lg flex items-center gap-2 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105 border border-fn-red"
    >
      <Pause size={16} />
      <span className="hidden xs:inline">หยุด</span>
    </button>
  );
};

// src/components/camera/FlashToggleButton.tsx
interface FlashToggleButtonProps {
  enabled: boolean;
  onClick: () => void;
}

export const FlashToggleButton: React.FC<FlashToggleButtonProps> = ({
  enabled,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 sm:px-4 rounded-lg flex items-center gap-2 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105 border ${
        enabled
          ? "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500"
          : "bg-gray-600 hover:bg-gray-700 text-white border-gray-600"
      }`}
      title={enabled ? "ปิดแฟลช" : "เปิดแฟลช"}
    >
      <Flashlight size={16} />
      <span className="hidden xs:inline">{enabled ? "แฟลช" : "แฟลช"}</span>
    </button>
  );
};

// src/components/camera/CaptureButton.tsx
interface CaptureButtonProps {
  processingQueue: number;
  onClick: () => void;
  disabled?: boolean;
}

export const CaptureButton: React.FC<CaptureButtonProps> = ({
  processingQueue,
  onClick,
  disabled = false,
}) => {
  const isProcessing = processingQueue > 0;

  return (
    <button
      onClick={onClick}
      disabled={disabled || isProcessing}
      className="bg-fn-green hover:bg-fn-green/90 disabled:bg-gray-400 disabled:opacity-50 disabled:transform-none text-white px-3 py-2 sm:px-4 rounded-lg flex items-center gap-2 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105 min-w-[80px] justify-center border border-fn-green"
    >
      <Zap size={16} />
      <span className="hidden sm:inline">
        {isProcessing ? `(${processingQueue})` : "สแกน"}
      </span>
      <span className="sm:hidden">{isProcessing ? processingQueue : ""}</span>
    </button>
  );
};

// src/components/camera/SettingsButton.tsx
interface SettingsButtonProps {
  onClick: () => void;
}

export const SettingsButton: React.FC<SettingsButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 border border-gray-600"
      title="ตั้งค่ากล้อง"
    >
      <Settings size={16} />
    </button>
  );
};

// src/components/camera/CameraStatusIndicator.tsx
interface CameraStatusIndicatorProps {
  isStreaming: boolean;
  resolution: string;
  processingQueue: number;
}

export const CameraStatusIndicator: React.FC<CameraStatusIndicatorProps> = ({
  isStreaming,
  resolution,
  processingQueue,
}) => {
  if (!isStreaming) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-gray-600 bg-white/80 px-2 py-1 rounded border">
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 rounded-full bg-green-500"></div>
        <span>Live</span>
      </div>
      <span>•</span>
      <span>{resolution}</span>
      {processingQueue > 0 && (
        <>
          <span>•</span>
          <span className="text-orange-600">Processing: {processingQueue}</span>
        </>
      )}
    </div>
  );
};
