"use client";

import React, { useEffect } from "react";
import { Camera, Sparkles } from "lucide-react";
import Image from "next/image";
import { useBarcodeDetection } from "../hooks/useBarcodeDetection";
import { CameraSection } from "../components/CameraSection";
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
    errors,
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
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          {/* Top Section with Logo */}
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center gap-3">
              {/* F&N Logo */}
              <div className="bg-gray-100 backdrop-blur-sm rounded-xl p-2 border border-gray-300 shadow-sm">
                <Image
                  src="/fn-logo.png"
                  alt="F&N Logo"
                  width={48}
                  height={48}
                  className="w-12 h-12 object-contain"
                  priority
                />
              </div>

              {/* Title Section */}
              <div className="text-center">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center justify-center gap-2 sm:gap-3">
                  <div className="bg-fn-green/10 p-2 rounded-lg border border-fn-green/20">
                    <Camera className="fn-green" size={24} />
                  </div>
                  <span className="fn-gradient-text">ระบบตรวจจับ Barcode</span>
                  <Sparkles className="fn-red" size={20} />
                </h1>
                <p className="text-gray-600 text-sm mt-2">
                  F&N Quality Control System | AI-Powered Real-time Detection
                </p>
              </div>
            </div>
          </div>
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
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 lg:gap-6">
          {/* Camera Section */}
          <div className="xl:col-span-3">
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

          {/* Results Sidebar - แสดงเฉพาะเลขที่ decode ได้ */}
          <div className="xl:col-span-1">
            <DetectionsList lastDetectedCode={lastDetectedCode} />
          </div>
        </div>

        {/* Mobile Tips */}
        <div className="xl:hidden mt-6 bg-white rounded-lg p-4 text-center border border-gray-200 shadow-sm">
          <p className="text-gray-700 text-sm mb-2">💡 เคล็ดลับสำหรับมือถือ</p>
          <div className="text-xs text-gray-500 space-y-1">
            <p>• ใช้ในแนวนอนเพื่อประสบการณ์ที่ดีที่สุด</p>
            <p>• วางบาร์โค้ดให้อยู่ตรงกลางหน้าจอ</p>
            <p>• ให้แสงเพียงพอเพื่อการสแกนที่แม่นยำ</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white/80 border-t border-gray-200 mt-8 shadow-sm">
        <div className="container mx-auto px-4 py-4 text-center">
          <p className="text-xs sm:text-sm text-gray-600">
            F&N Quality Control System | ระบบตรวจจับ Barcode แบบ Real-time |
            <span className="fn-green font-medium">
              {" "}
              พัฒนาด้วย Next.js & AI
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
