"use client";

import React from "react";
import { Play, Pause, RotateCcw, Zap } from "lucide-react";

interface ControlButtonsProps {
  isStreaming: boolean;
  processingQueue: number;
  startCamera: () => void;
  stopCamera: () => void;
  switchCamera: () => void;
  captureAndProcess: () => void;
}

export const ControlButtons: React.FC<ControlButtonsProps> = ({
  isStreaming,
  processingQueue,
  startCamera,
  stopCamera,
  switchCamera,
  captureAndProcess,
}) => {
  return (
    <div className="flex flex-wrap justify-center sm:justify-end items-center gap-2">
      {!isStreaming ? (
        <button
          onClick={startCamera}
          className="bg-green-600 hover:bg-green-700 px-3 py-2 sm:px-4 rounded-lg flex items-center gap-2 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <Play size={16} />
          <span className="hidden xs:inline">เริ่ม</span>
        </button>
      ) : (
        <button
          onClick={stopCamera}
          className="bg-red-600 hover:bg-red-700 px-3 py-2 sm:px-4 rounded-lg flex items-center gap-2 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <Pause size={16} />
          <span className="hidden xs:inline">หยุด</span>
        </button>
      )}

      {/* <button
        onClick={switchCamera}
        disabled={!isStreaming}
        className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:opacity-50 disabled:transform-none px-3 py-2 sm:px-4 rounded-lg flex items-center gap-2 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
      >
        <RotateCcw size={16} />
        <span className="hidden xs:inline">สลับ</span>
      </button> */}

      {/* <button
        onClick={captureAndProcess}
        disabled={!isStreaming}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 disabled:transform-none px-3 py-2 sm:px-4 rounded-lg flex items-center gap-2 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105 min-w-[80px] justify-center"
      >
        <Zap size={16} />
        <span className="hidden sm:inline">
          {processingQueue > 0 ? `(${processingQueue})` : "สแกน"}
        </span>
        <span className="sm:hidden">
          {processingQueue > 0 ? processingQueue : ""}
        </span>
      </button> */}
    </div>
  );
};
