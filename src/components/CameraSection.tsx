"use client";

import React, { useEffect } from "react";
import { Camera, Square } from "lucide-react";
import { ControlButtons } from "./ControlButtons";
import { Detection } from "../types/detection";

interface CameraSectionProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  containerRef: React.RefObject<HTMLDivElement>;
  isStreaming: boolean;
  processingQueue: number;
  detections: Detection[];
  startCamera: () => void;
  stopCamera: () => void;
  switchCamera: () => void;
  captureAndProcess: () => void;
  drawDetections: () => void;
  updateCanvasSize: () => void;
}

export const CameraSection: React.FC<CameraSectionProps> = ({
  videoRef,
  canvasRef,
  containerRef,
  isStreaming,
  processingQueue,
  detections,
  startCamera,
  stopCamera,
  switchCamera,
  captureAndProcess,
  drawDetections,
  updateCanvasSize,
}) => {
  // Real-time Canvas Animation
  useEffect(() => {
    let animationId: number;

    const animate = () => {
      drawDetections();
      updateCanvasSize();
      animationId = requestAnimationFrame(animate);
    };

    if (isStreaming) {
      animate();
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isStreaming, drawDetections, updateCanvasSize]);

  return (
    <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 lg:p-6 shadow-2xl border border-gray-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <h2 className="text-lg lg:text-xl font-semibold flex items-center gap-2">
          <Square className="text-green-400" size={20} />
          กล้อง
        </h2>
        <ControlButtons
          isStreaming={isStreaming}
          processingQueue={processingQueue}
          startCamera={startCamera}
          stopCamera={stopCamera}
          switchCamera={switchCamera}
          captureAndProcess={captureAndProcess}
        />
      </div>

      {/* Video Container */}
      <div
        ref={containerRef}
        className="relative bg-black rounded-xl overflow-hidden w-full border-2 border-gray-600"
        style={{
          aspectRatio: "16/9",
          minHeight: "250px",
          maxHeight: "70vh",
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-contain"
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 pointer-events-none"
          style={{
            mixBlendMode: "screen",
            zIndex: 10,
          }}
        />

        {/* Processing Overlay */}
        {processingQueue > 0 && (
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center z-20">
            <div className="bg-blue-600 text-white px-3 py-2 sm:px-4 rounded-lg flex items-center gap-2 text-sm shadow-lg">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span className="hidden sm:inline">กำลังประมวลผล...</span>
              <span className="sm:hidden">ประมวลผล...</span>
              <span>({processingQueue})</span>
            </div>
          </div>
        )}

        {/* Camera Placeholder */}
        {!isStreaming && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <div className="text-center p-4">
              <Camera size={48} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm sm:text-base mb-2">
                กดปุ่ม "เริ่ม" เพื่อเปิดกล้อง
              </p>
              <p className="text-xs text-gray-500">
                รองรับ Chrome, Safari, Edge
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Status Info */}
      <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-400 space-y-2 bg-gray-700/50 rounded-lg p-3">
        <p className="flex items-center gap-2">
          💡
          <span className="hidden sm:inline">
            เคล็ดลับ: วางบาร์โค้ดให้อยู่ในกรอบและรอระบบประมวลผลอัตโนมัติ
          </span>
          <span className="sm:hidden">วางบาร์โค้ดในกรอบ</span>
        </p>
        <p className="flex items-center gap-2">
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              processingQueue > 0
                ? "bg-orange-400 animate-pulse"
                : "bg-green-400"
            }`}
          ></span>
          <span>
            สถานะ: {processingQueue > 0 ? "กำลังทำงาน" : "พร้อม"}
            <span className="hidden sm:inline"> | ประมวลผลทุก 300ms</span>
          </span>
        </p>
      </div>
    </div>
  );
};
