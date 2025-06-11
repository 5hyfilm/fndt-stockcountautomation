// src/components/layout/MobileScannerLayout.tsx
"use client";

import React, { useEffect, useState } from "react";
import { CameraSection } from "../CameraSection";
import { MobileProductSlide } from "./MobileProductSlide";

interface MobileScannerLayoutProps {
  // Camera props
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  containerRef: React.RefObject<HTMLDivElement>;
  isStreaming: boolean;
  processingQueue: number;
  detections: any[];

  // Camera actions
  startCamera: () => void;
  stopCamera: () => void;
  switchCamera: () => void;
  captureAndProcess: () => void;
  drawDetections: () => void;
  updateCanvasSize: () => void;

  // Product props
  product: any;
  detectedBarcodeType?: "ea" | "dsp" | "cs" | null;
  isLoadingProduct: boolean;
  productError: string | null;
  lastDetectedCode: string;

  // Product actions
  onAddToInventory: (
    product: any,
    quantity: number,
    barcodeType?: "ea" | "dsp" | "cs"
  ) => boolean;
  restartForNextScan: () => void;
  currentInventoryQuantity: number;
}

export const MobileScannerLayout: React.FC<MobileScannerLayoutProps> = ({
  // Camera props
  videoRef,
  canvasRef,
  containerRef,
  isStreaming,
  processingQueue,
  detections,

  // Camera actions
  startCamera,
  stopCamera,
  switchCamera,
  captureAndProcess,
  drawDetections,
  updateCanvasSize,

  // Product props
  product,
  detectedBarcodeType,
  isLoadingProduct,
  productError,
  lastDetectedCode,

  // Product actions
  onAddToInventory,
  restartForNextScan,
  currentInventoryQuantity,
}) => {
  const [showProductSlide, setShowProductSlide] = useState(false);

  // Show product slide when product is found and camera is stopped
  useEffect(() => {
    if (product && !isStreaming && !isLoadingProduct) {
      setShowProductSlide(true);
    } else {
      setShowProductSlide(false);
    }
  }, [product, isStreaming, isLoadingProduct]);

  // Handle close product slide and restart scanning
  const handleCloseProductSlide = () => {
    setShowProductSlide(false);
    // Clear product data and prepare for next scan
    restartForNextScan();
    // Restart camera after a small delay
    setTimeout(() => {
      startCamera();
    }, 300);
  };

  return (
    <div className="relative h-screen bg-gray-900 overflow-hidden">
      {/* Camera Section - Full Screen */}
      <div className="absolute inset-0">
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

      {/* Loading Overlay */}
      {isLoadingProduct && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-30">
          <div className="bg-white rounded-lg p-4 flex items-center space-x-3">
            <div className="animate-spin w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full"></div>
            <span className="text-gray-900 font-medium">
              กำลังค้นหาสินค้า...
            </span>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {productError && (
        <div className="absolute inset-x-0 top-4 z-30 mx-4">
          <div className="bg-red-100 border border-red-300 rounded-lg p-4">
            <div className="text-red-800 text-sm font-medium">
              {productError}
            </div>
          </div>
        </div>
      )}

      {/* Success Detection Feedback */}
      {lastDetectedCode && !productError && (
        <div className="absolute inset-x-0 top-4 z-30 mx-4">
          <div className="bg-green-100 border border-green-300 rounded-lg p-3">
            <div className="text-green-800 text-sm">
              ✅ ตรวจพบ: {lastDetectedCode}
            </div>
          </div>
        </div>
      )}

      {/* Product Slide Panel */}
      <MobileProductSlide
        isVisible={showProductSlide}
        product={product}
        detectedBarcodeType={detectedBarcodeType || undefined}
        currentInventoryQuantity={currentInventoryQuantity}
        onClose={handleCloseProductSlide}
        onAddToInventory={onAddToInventory}
      />

      {/* Scan Instructions - Only show when camera is active and no product */}
      {isStreaming && !product && !isLoadingProduct && (
        <div className="absolute inset-x-0 bottom-8 z-20 mx-4">
          <div className="bg-black/70 backdrop-blur-sm rounded-lg p-4">
            <div className="text-white text-center">
              <div className="text-lg font-medium mb-1">วางบาร์โค้ดในกรอบ</div>
              <div className="text-sm opacity-90">
                เครื่องจะสแกนโดยอัตโนมัติ
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
