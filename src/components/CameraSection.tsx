"use client";

import React, { useEffect } from "react";
import { Camera, Video, VideoOff, Loader } from "lucide-react";
import { Detection } from "../types/detection";
import { ControlButtons } from "./ControlButtons";

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
  // Draw detections when detections change
  useEffect(() => {
    if (detections.length > 0) {
      drawDetections();
    }
  }, [detections, drawDetections]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      updateCanvasSize();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateCanvasSize]);

  return (
    <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-700/50 px-4 py-3 border-b border-gray-600/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-blue-500/20 p-2 rounded-lg">
            <Camera className="text-blue-400" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">กล้องตรวจจับ</h2>
            <p className="text-xs text-gray-400">
              {isStreaming ? "🟢 กำลังทำงาน" : "🔴 หยุดทำงาน"}
            </p>
          </div>
        </div>

        <ControlButtons
          isStreaming={isStreaming}
          processingQueue={processingQueue}
          startCamera={startCamera}
          stopCamera={stopCamera}
          switchCamera={switchCamera}
          captureAndProcess={captureAndProcess}
        />
      </div>

      {/* Camera Container */}
      <div className="relative bg-black">
        <div
          ref={containerRef}
          className="relative w-full"
          style={{ aspectRatio: "16/9" }}
        >
          {/* Video Element */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            onLoadedMetadata={updateCanvasSize}
          />

          {/* Overlay Canvas for Detections */}
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
          />

          {/* Center Guide */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 border-2 border-blue-400/50 rounded-lg">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-400"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-400"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-400"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-400"></div>
            </div>
          </div>

          {/* Processing Indicator */}
          {processingQueue > 0 && (
            <div className="absolute top-4 right-4 bg-orange-600/90 backdrop-blur-sm px-3 py-2 rounded-lg flex items-center gap-2">
              <Loader className="animate-spin" size={16} />
              <span className="text-sm font-medium">
                ประมวลผล... ({processingQueue})
              </span>
            </div>
          )}

          {/* Detection Counter */}
          {detections.length > 0 && (
            <div className="absolute top-4 left-4 bg-green-600/90 backdrop-blur-sm px-3 py-2 rounded-lg">
              <span className="text-sm font-medium">
                พบ {detections.length} บาร์โค้ด
              </span>
            </div>
          )}

          {/* No Stream Overlay */}
          {!isStreaming && (
            <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center">
                <div className="bg-gray-700 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <VideoOff className="text-gray-400" size={32} />
                </div>
                <p className="text-gray-300 text-lg font-medium mb-2">
                  กล้องไม่ได้เปิดใช้งาน
                </p>
                <p className="text-gray-500 text-sm">
                  กดปุ่ม "เริ่ม" เพื่อเปิดกล้อง
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Info Bar */}
        <div className="bg-gray-700/30 px-4 py-2 border-t border-gray-600/30">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Video size={12} />
                1280x720
              </span>
              <span>Auto Focus</span>
              <span>Real-time Detection</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>AI Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
