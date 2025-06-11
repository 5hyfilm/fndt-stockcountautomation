// src/components/ControlButtons.tsx
"use client";

import React from "react";
import { Play, Square, RotateCcw, Camera, Loader2 } from "lucide-react";

interface ControlButtonsProps {
  isStreaming: boolean;
  processingQueue: number;
  startCamera: () => void;
  stopCamera: () => void;
  switchCamera: () => void;
  captureAndProcess: () => void;
  compact?: boolean; // New prop for mobile optimization
}

export const ControlButtons: React.FC<ControlButtonsProps> = ({
  isStreaming,
  processingQueue,
  startCamera,
  stopCamera,
  switchCamera,
  captureAndProcess,
  compact = false,
}) => {
  // Compact mobile layout
  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {/* Start/Stop Camera Button */}
        <button
          onClick={isStreaming ? stopCamera : startCamera}
          className={`p-2 rounded-md transition-colors ${
            isStreaming
              ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
              : "bg-green-50 text-green-600 border border-green-200 hover:bg-green-100"
          }`}
          title={isStreaming ? "หยุดกล้อง" : "เปิดกล้อง"}
        >
          {isStreaming ? <Square size={16} /> : <Play size={16} />}
        </button>

        {/* Switch Camera Button */}
        {isStreaming && (
          <button
            onClick={switchCamera}
            className="p-2 rounded-md bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors"
            title="เปลี่ยนกล้อง"
          >
            <RotateCcw size={16} />
          </button>
        )}

        {/* Capture Button */}
        {isStreaming && (
          <button
            onClick={captureAndProcess}
            disabled={processingQueue > 0}
            className="p-2 rounded-md bg-fn-green text-white border border-fn-green hover:bg-fn-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="ถ่ายภาพ"
          >
            {processingQueue > 0 ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Camera size={16} />
            )}
          </button>
        )}

        {/* Processing Queue Indicator */}
        {processingQueue > 0 && (
          <div className="bg-orange-100 text-orange-600 px-2 py-1 rounded-md text-xs font-medium">
            {processingQueue}
          </div>
        )}
      </div>
    );
  }

  // Original desktop layout
  return (
    <div className="flex items-center gap-3">
      {/* Start/Stop Camera Button */}
      <button
        onClick={isStreaming ? stopCamera : startCamera}
        className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
          isStreaming
            ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
            : "bg-green-50 text-green-600 border border-green-200 hover:bg-green-100"
        }`}
      >
        {isStreaming ? (
          <>
            <Square size={16} />
            หยุดกล้อง
          </>
        ) : (
          <>
            <Play size={16} />
            เปิดกล้อง
          </>
        )}
      </button>

      {/* Switch Camera Button */}
      {isStreaming && (
        <button
          onClick={switchCamera}
          className="px-3 py-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors flex items-center gap-2"
        >
          <RotateCcw size={16} />
          เปลี่ยนกล้อง
        </button>
      )}

      {/* Capture Button */}
      {isStreaming && (
        <button
          onClick={captureAndProcess}
          disabled={processingQueue > 0}
          className="px-4 py-2 rounded-lg bg-fn-green text-white hover:bg-fn-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {processingQueue > 0 ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              กำลังประมวลผล
            </>
          ) : (
            <>
              <Camera size={16} />
              ถ่ายภาพ
            </>
          )}
        </button>
      )}

      {/* Processing Queue Display */}
      {processingQueue > 0 && (
        <div className="bg-orange-100 text-orange-600 px-3 py-2 rounded-lg text-sm font-medium">
          คิวงาน: {processingQueue}
        </div>
      )}
    </div>
  );
};
