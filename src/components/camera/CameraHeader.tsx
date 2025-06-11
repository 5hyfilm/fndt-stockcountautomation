// src/components/camera/CameraHeader.tsx - Enhanced with State Awareness
"use client";

import React from "react";
import {
  Camera,
  Eye,
  EyeOff,
  CheckCircle,
  Loader2,
  Play,
  Square,
} from "lucide-react";
import { ControlButtons } from "../ControlButtons";

interface CameraHeaderProps {
  isStreaming: boolean;
  processingQueue: number;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onSwitchCamera: () => void;
  onCaptureAndProcess: () => void;
  cameraState?: "scanning" | "found" | "idle";
  isMobile?: boolean;
}

export const CameraHeader: React.FC<CameraHeaderProps> = ({
  isStreaming,
  processingQueue,
  onStartCamera,
  onStopCamera,
  onSwitchCamera,
  onCaptureAndProcess,
  cameraState = "idle",
  isMobile = false,
}) => {
  // Get status info based on camera state
  const getStatusInfo = () => {
    switch (cameraState) {
      case "scanning":
        return {
          icon: <Eye className="text-fn-green" size={20} />,
          text: "กำลังสแกน",
          color: "text-fn-green",
        };
      case "found":
        return {
          icon: <CheckCircle className="text-green-600" size={20} />,
          text: "พบสินค้า",
          color: "text-green-600",
        };
      case "idle":
      default:
        return {
          icon: <EyeOff className="text-gray-500" size={20} />,
          text: "พร้อมใช้งาน",
          color: "text-gray-500",
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div
      className={`bg-white border-b border-gray-200 ${
        isMobile ? "px-3 py-2" : "px-4 py-3"
      }`}
    >
      <div className="flex items-center justify-between">
        {/* Left: Title and Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Camera className="text-fn-green" size={isMobile ? 18 : 20} />
            <h2
              className={`font-semibold text-gray-900 ${
                isMobile ? "text-base" : "text-lg"
              }`}
            >
              สแกนบาร์โค้ด
            </h2>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            {statusInfo.icon}
            <span className={`text-sm font-medium ${statusInfo.color}`}>
              {statusInfo.text}
            </span>

            {/* Processing indicator */}
            {processingQueue > 0 && (
              <div className="flex items-center gap-1">
                <Loader2 size={14} className="animate-spin text-orange-500" />
                <span className="text-xs text-orange-600 font-medium">
                  {processingQueue}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Control Buttons */}
        <div className="flex items-center gap-2">
          {isMobile ? (
            // Mobile: Simplified controls
            <div className="flex items-center gap-1">
              {/* Primary Action Button */}
              <button
                onClick={isStreaming ? onStopCamera : onStartCamera}
                className={`p-2 rounded-lg transition-colors ${
                  isStreaming
                    ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                    : "bg-green-50 text-green-600 border border-green-200 hover:bg-green-100"
                }`}
                title={isStreaming ? "หยุดกล้อง" : "เปิดกล้อง"}
              >
                {isStreaming ? <Square size={18} /> : <Play size={18} />}
              </button>

              {/* Switch Camera - Only show when streaming */}
              {isStreaming && (
                <button
                  onClick={onSwitchCamera}
                  className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors"
                  title="เปลี่ยนกล้อง"
                >
                  <Camera size={16} />
                </button>
              )}
            </div>
          ) : (
            // Desktop: Full control buttons
            <ControlButtons
              isStreaming={isStreaming}
              processingQueue={processingQueue}
              startCamera={onStartCamera}
              stopCamera={onStopCamera}
              switchCamera={onSwitchCamera}
              captureAndProcess={onCaptureAndProcess}
              compact={false}
            />
          )}
        </div>
      </div>

      {/* Mobile: Secondary info bar */}
      {isMobile && cameraState === "scanning" && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>จัดให้บาร์โค้ดอยู่ในกรอบเพื่อสแกน</span>
            {processingQueue > 0 && (
              <span className="text-orange-600 font-medium">
                ประมวลผล {processingQueue} รายการ
              </span>
            )}
          </div>
        </div>
      )}

      {/* Success state for mobile */}
      {isMobile && cameraState === "found" && (
        <div className="mt-2 pt-2 border-t border-green-100 bg-green-50/50">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle size={16} />
            <span>สแกนสำเร็จ - ตรวจสอบข้อมูลสินค้าด้านล่าง</span>
          </div>
        </div>
      )}
    </div>
  );
};
