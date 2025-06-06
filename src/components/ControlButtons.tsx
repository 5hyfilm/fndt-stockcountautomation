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
          className="bg-fn-green hover:bg-fn-green/90 text-white px-3 py-2 sm:px-4 rounded-lg flex items-center gap-2 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105 border border-fn-green"
        >
          <Play size={16} />
          <span className="hidden xs:inline">เริ่ม</span>
        </button>
      ) : (
        <button
          onClick={stopCamera}
          className="bg-fn-red hover:bg-fn-red/90 text-white px-3 py-2 sm:px-4 rounded-lg flex items-center gap-2 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105 border border-fn-red"
        >
          <Pause size={16} />
          <span className="hidden xs:inline">หยุด</span>
        </button>
      )}

      {/* <button
        onClick={switchCamera}
        disabled={!isStreaming}
        className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 disabled:opacity-50 disabled:transform-none text-white px-3 py-2 sm:px-4 rounded-lg flex items-center gap-2 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105 border border-gray-600"
      >
        <RotateCcw size={16} />
        <span className="hidden xs:inline">สลับ</span>
      </button> */}

      {/* <button
        onClick={captureAndProcess}
        disabled={!isStreaming}
        className="bg-fn-green hover:bg-fn-green/90 disabled:bg-gray-400 disabled:opacity-50 disabled:transform-none text-white px-3 py-2 sm:px-4 rounded-lg flex items-center gap-2 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105 min-w-[80px] justify-center border border-fn-green"
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
