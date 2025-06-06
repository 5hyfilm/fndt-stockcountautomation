"use client";

import React, { useEffect } from "react";
import { Camera, Sparkles } from "lucide-react";
import { useBarcodeDetection } from "../hooks/useBarcodeDetection";
import { CameraSection } from "../components/CameraSection";
import { DetectionStats } from "../components/DetectionStats";
import { LastDetectedCode } from "../components/LastDetectedCode";
import { DetectionsList } from "../components/DetectionsList";
import { ErrorDisplay } from "../components/ErrorDisplay";

export default function BarcodeDetectionPage() {
  const {
    videoRef,
    canvasRef,
    containerRef,
    isStreaming,
    detections,
    processingQueue,
    lastDetectedCode,
    stats,
    errors,
    videoConstraints,
    startCamera,
    stopCamera,
    switchCamera,
    captureAndProcess,
    drawDetections,
    updateCanvasSize,
    clearError,
  } = useBarcodeDetection();

  // ประมวลผลอัตโนมัติ Real-time
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isStreaming) {
      interval = setInterval(() => {
        captureAndProcess();
      }, 300);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStreaming, captureAndProcess]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center flex items-center justify-center gap-2 sm:gap-3">
            <div className="bg-blue-500/20 p-2 rounded-lg">
              <Camera className="text-blue-400" size={24} />
            </div>
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              ระบบตรวจจับ Barcode
            </span>
            <Sparkles className="text-yellow-400" size={20} />
          </h1>
          <p className="text-center text-gray-400 text-sm mt-2">
            AI-Powered Real-time Detection
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-4 sm:py-6">
        {/* Error Display */}
        {errors && (
          <div className="mb-4">
            <ErrorDisplay
              error={errors}
              onDismiss={clearError}
              onRetry={() => {
                clearError();
                if (!isStreaming) startCamera();
              }}
            />
          </div>
        )}

        {/* Layout Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
          {/* Camera Section */}
          <div className="xl:col-span-2">
            <CameraSection
              videoRef={videoRef}
              canvasRef={canvasRef}
              containerRef={containerRef}
              isStreaming={isStreaming}
              processingQueue={processingQueue}
              detections={detections}
              startCamera={startCamera}
              stopCamera={stopCamera}
              switchCamera={switchCamera}
              captureAndProcess={captureAndProcess}
              drawDetections={drawDetections}
              updateCanvasSize={updateCanvasSize}
            />
          </div>

          {/* Results Sidebar */}
          <div className="space-y-4 lg:space-y-6">
            {/* Detection Stats */}
            <DetectionStats
              stats={stats}
              videoConstraints={videoConstraints}
              processingQueue={processingQueue}
            />

            {/* Last Detected Code */}
            <LastDetectedCode code={lastDetectedCode} />

            {/* Detections List */}
            <DetectionsList detections={detections} />
          </div>
        </div>

        {/* Mobile Tips */}
        <div className="xl:hidden mt-6 bg-gray-800/50 rounded-lg p-4 text-center border border-gray-700/50">
          <p className="text-gray-400 text-sm mb-2">💡 เคล็ดลับสำหรับมือถือ</p>
          <div className="text-xs text-gray-500 space-y-1">
            <p>• ใช้ในแนวนอนเพื่อประสบการณ์ที่ดีที่สุด</p>
            <p>• วางบาร์โค้ดให้อยู่ตรงกลางหน้าจอ</p>
            <p>• ให้แสงเพียงพอเพื่อการสแกนที่แม่นยำ</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-800/30 border-t border-gray-700/50 mt-8">
        <div className="container mx-auto px-4 py-4 text-center">
          <p className="text-xs sm:text-sm text-gray-400">
            ระบบตรวจจับ Barcode แบบ Real-time |
            <span className="text-blue-400"> พัฒนาด้วย Next.js & AI</span>
          </p>
        </div>
      </div>
    </div>
  );
}
