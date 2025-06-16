// src/components/scanner/BarcodeScanner.tsx
"use client";

import React, { useEffect, useRef } from "react";
import { useBarcodeDetection } from "../../hooks/useBarcodeDetection";
import { Camera, CameraOff, RotateCcw } from "lucide-react";

// ===== INTERFACES =====
interface BarcodeScannerProps {
  onBarcodeDetected: (barcode: string) => void;
  isStreaming: boolean;
  onStreamStart?: () => void;
  onStreamStop?: () => void;
  className?: string;
  showControls?: boolean;
}

// ===== MAIN COMPONENT =====
const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onBarcodeDetected,
  isStreaming: externalIsStreaming,
  onStreamStart,
  onStreamStop,
  className = "",
  showControls = true,
}) => {
  const animationFrameRef = useRef<number>();

  // ใช้ useBarcodeDetection hook (ไม่ต้องการ parameters)
  const {
    videoRef,
    canvasRef,
    containerRef,
    isStreaming: internalIsStreaming,
    startCamera,
    stopCamera,
    switchCamera,
    drawDetections,
    updateCanvasSize,
    lastDetectedCode,
    errors,
    clearError,
  } = useBarcodeDetection();

  // Sync external streaming state
  useEffect(() => {
    if (externalIsStreaming && !internalIsStreaming) {
      console.log("📷 External request to start camera");
      startCamera();
      onStreamStart?.();
    } else if (!externalIsStreaming && internalIsStreaming) {
      console.log("📷 External request to stop camera");
      stopCamera();
      onStreamStop?.();
    }
  }, [
    externalIsStreaming,
    internalIsStreaming,
    startCamera,
    stopCamera,
    onStreamStart,
    onStreamStop,
  ]);

  // แจ้งเมื่อตรวจพบ barcode
  useEffect(() => {
    if (lastDetectedCode) {
      console.log("📱 Barcode detected in scanner:", lastDetectedCode);
      onBarcodeDetected(lastDetectedCode);
    }
  }, [lastDetectedCode, onBarcodeDetected]);

  // Animation loop สำหรับ drawing detections
  useEffect(() => {
    if (internalIsStreaming) {
      const animate = () => {
        drawDetections();
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [internalIsStreaming, drawDetections]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      updateCanvasSize();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateCanvasSize]);

  // Handle camera start
  const handleStartCamera = async () => {
    try {
      await startCamera();
      onStreamStart?.();
    } catch (error) {
      console.error("Failed to start camera:", error);
    }
  };

  // Handle camera stop
  const handleStopCamera = () => {
    stopCamera();
    onStreamStop?.();
  };

  // Handle camera switch
  const handleSwitchCamera = async () => {
    try {
      await switchCamera();
    } catch (error) {
      console.error("Failed to switch camera:", error);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden bg-black ${className}`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        playsInline
        muted
        style={{
          transform: "scaleX(-1)", // Mirror effect
        }}
      />

      {/* Canvas for drawing detections */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          transform: "scaleX(-1)", // Mirror effect to match video
        }}
      />

      {/* Scanning overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative">
          {/* Scanning frame */}
          <div className="w-64 h-64 border-2 border-white/50 rounded-lg relative">
            {/* Corner indicators */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-400 rounded-tl-lg"></div>
            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-400 rounded-tr-lg"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-400 rounded-bl-lg"></div>
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-400 rounded-br-lg"></div>

            {/* Scanning line animation */}
            {internalIsStreaming && (
              <div className="absolute inset-0 overflow-hidden rounded-lg">
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-pulse"></div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
            <p className="text-white text-center text-sm font-medium">
              {internalIsStreaming ? "วางบาร์โค้ดในกรอบ" : "กดเริ่มสแกน"}
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {errors && (
        <div className="absolute top-4 left-4 right-4 bg-red-500/90 backdrop-blur-sm text-white p-3 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm">{errors}</span>
            <button
              onClick={clearError}
              className="text-white/80 hover:text-white ml-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Camera Controls */}
      {showControls && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
          <div className="flex space-x-4">
            {/* Start/Stop Camera Button */}
            <button
              onClick={
                internalIsStreaming ? handleStopCamera : handleStartCamera
              }
              className={`p-4 rounded-full shadow-lg transition-all duration-200 ${
                internalIsStreaming
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-green-500 hover:bg-green-600 text-white"
              }`}
              disabled={false}
            >
              {internalIsStreaming ? (
                <CameraOff size={24} />
              ) : (
                <Camera size={24} />
              )}
            </button>

            {/* Switch Camera Button */}
            {internalIsStreaming && (
              <button
                onClick={handleSwitchCamera}
                className="p-4 bg-gray-600 hover:bg-gray-700 text-white rounded-full shadow-lg transition-all duration-200"
              >
                <RotateCcw size={24} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Status Indicator */}
      <div className="absolute top-4 right-4 z-20">
        <div
          className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
            internalIsStreaming
              ? "bg-green-500/90 text-white"
              : "bg-gray-500/90 text-white"
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              internalIsStreaming ? "bg-white animate-pulse" : "bg-gray-300"
            }`}
          ></div>
          <span>{internalIsStreaming ? "กำลังสแกน" : "ปิดกล้อง"}</span>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
