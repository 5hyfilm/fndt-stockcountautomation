// src/components/ScanStatusDisplay.tsx - Real-time scanning status
"use client";

import React from "react";
import {
  Camera,
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  Pause,
  Play,
  BarChart3,
} from "lucide-react";

interface ScanStatusDisplayProps {
  isStreaming: boolean;
  hasProduct: boolean;
  isProcessingPaused: boolean;
  processingQueue: number;
  lastDetectedCode: string;
  isLoadingProduct: boolean;
  scanCount: number;
  sessionName?: string;
  onPauseResume?: () => void;
}

export const ScanStatusDisplay: React.FC<ScanStatusDisplayProps> = ({
  isStreaming,
  hasProduct,
  isProcessingPaused,
  processingQueue,
  lastDetectedCode,
  isLoadingProduct,
  scanCount,
  sessionName,
  onPauseResume,
}) => {
  const getStatusColor = () => {
    if (!isStreaming) return "text-gray-500";
    if (isProcessingPaused) return "text-orange-500";
    if (hasProduct) return "text-green-500";
    if (processingQueue > 0) return "text-blue-500";
    return "text-gray-500";
  };

  const getStatusText = () => {
    if (!isStreaming) return "กล้องปิด";
    if (isLoadingProduct) return "กำลังค้นหาสินค้า...";
    if (isProcessingPaused) return "หยุดสแกนชั่วคราว";
    if (hasProduct) return "พบสินค้าแล้ว";
    if (processingQueue > 0) return "กำลังประมวลผล...";
    return "พร้อมสแกน";
  };

  const getStatusIcon = () => {
    if (!isStreaming) return <Camera className={getStatusColor()} size={16} />;
    if (isLoadingProduct)
      return (
        <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
      );
    if (isProcessingPaused)
      return <Pause className={getStatusColor()} size={16} />;
    if (hasProduct)
      return <CheckCircle className={getStatusColor()} size={16} />;
    if (processingQueue > 0)
      return (
        <div className="animate-pulse">
          <Package className={getStatusColor()} size={16} />
        </div>
      );
    return <Camera className={getStatusColor()} size={16} />;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
      {/* Main Status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>

        {/* Pause/Resume Button */}
        {isStreaming && onPauseResume && (
          <button
            onClick={onPauseResume}
            className={`p-2 rounded-lg transition-colors ${
              isProcessingPaused
                ? "bg-green-100 text-green-600 hover:bg-green-200"
                : "bg-orange-100 text-orange-600 hover:bg-orange-200"
            }`}
            title={isProcessingPaused ? "เริ่มสแกนต่อ" : "หยุดสแกนชั่วคราว"}
          >
            {isProcessingPaused ? <Play size={16} /> : <Pause size={16} />}
          </button>
        )}
      </div>

      {/* Session Info */}
      {sessionName && (
        <div className="mb-3 p-2 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800">
            <BarChart3 size={14} />
            <span className="text-xs font-medium">เซชัน: {sessionName}</span>
          </div>
        </div>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isStreaming ? "bg-green-400" : "bg-gray-400"
            }`}
          ></div>
          <span className="text-gray-600">
            กล้อง: {isStreaming ? "เปิด" : "ปิด"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Package size={12} className="text-gray-400" />
          <span className="text-gray-600">สแกน: {scanCount} รายการ</span>
        </div>

        {processingQueue > 0 && (
          <div className="flex items-center gap-2">
            <Clock size={12} className="text-blue-500" />
            <span className="text-blue-600">คิว: {processingQueue}/3</span>
          </div>
        )}

        {lastDetectedCode && (
          <div className="col-span-2 mt-2">
            <div className="bg-gray-50 rounded p-2">
              <div className="text-gray-500 text-xs mb-1">บาร์โค้ดล่าสุด:</div>
              <code className="text-xs font-mono text-gray-800 break-all">
                {lastDetectedCode}
              </code>
            </div>
          </div>
        )}
      </div>

      {/* Warnings */}
      {!isStreaming && (
        <div className="mt-3 flex items-center gap-2 text-amber-600 bg-amber-50 rounded-lg p-2">
          <AlertTriangle size={14} />
          <span className="text-xs">เปิดกล้องเพื่อเริ่มสแกน</span>
        </div>
      )}

      {isProcessingPaused && isStreaming && (
        <div className="mt-3 flex items-center gap-2 text-orange-600 bg-orange-50 rounded-lg p-2">
          <Pause size={14} />
          <span className="text-xs">การสแกนหยุดชั่วคราว</span>
        </div>
      )}
    </div>
  );
};
