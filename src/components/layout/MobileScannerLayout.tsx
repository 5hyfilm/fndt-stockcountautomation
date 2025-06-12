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

  // Layout options
  fullScreen?: boolean;
  showHeader?: boolean;
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

  // Layout options
  fullScreen = true,
  showHeader = true,
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
    restartForNextScan();
    setTimeout(() => {
      startCamera();
    }, 300);
  };

  // Container styles
  const containerClasses = fullScreen
    ? "relative bg-black overflow-hidden"
    : "relative h-screen bg-gray-900 overflow-hidden";

  const containerStyle = fullScreen
    ? {
        height: "calc(100vh - 120px)",
        minHeight: "calc(100vh - 120px)",
      }
    : {};

  return (
    <div className={containerClasses} style={containerStyle}>
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
          fullScreen={fullScreen}
          showHeader={showHeader}
        />
      </div>

      {/* ปุ่มปิดกล้อง มุมบนขวา - เฉพาะเมื่อกล้องเปิดและไม่แสดง header */}
      {!showHeader && isStreaming && (
        <div className="absolute top-4 right-4 z-30">
          <button
            onClick={stopCamera}
            className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full shadow-lg transition-colors"
            title="หยุดกล้อง"
          >
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h12v12H6V6z" />
            </svg>
          </button>
        </div>
      )}

      {/* ปุ่มเปิดกล้องใหญ่ ตรงกลาง - เมื่อกล้องปิด */}
      {!showHeader && !isStreaming && (
        <div className="absolute inset-0 flex items-center justify-center z-30">
          <div className="text-center">
            <button
              onClick={startCamera}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-full text-lg font-medium shadow-xl transition-colors mb-4"
            >
              <div className="flex items-center gap-3">
                <svg
                  width="28"
                  height="28"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M9.5 6.5v3h5v-3h2.5l-5-5-5 5h2.5zM11 4H9l3-3 3 3h-2v5.5h-2V4z" />
                  <path d="M4 6h5v2H4c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2h-5V6h5c2.21 0 4 1.79 4 4v8c0 2.21-1.79 4-4 4H4c-2.21 0-4-1.79-4-4v-8c0-2.21 1.79-4 4-4z" />
                  <circle cx="12" cy="14" r="2.5" />
                </svg>
                เปิดกล้อง
              </div>
            </button>
            {/* <p className="text-white/80 text-sm">แตะเพื่อเริ่มสแกนบาร์โค้ด</p> */}
          </div>
        </div>
      )}

      {/* ปุ่มสแกน ข้างล่าง - เมื่อกล้องเปิด */}
      {/* {!showHeader && isStreaming && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30">
          <button
            onClick={captureAndProcess}
            disabled={processingQueue > 0}
            className="bg-white hover:bg-gray-100 text-black p-4 rounded-full shadow-xl transition-colors disabled:opacity-50"
            title="สแกนด้วยตนเอง"
          >
            <svg width="32" height="32" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9.5 2A1.5 1.5 0 0 0 8 3.5v1A1.5 1.5 0 0 0 9.5 6h5A1.5 1.5 0 0 0 16 4.5v-1A1.5 1.5 0 0 0 14.5 2h-5zM6 7a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H6z" />
            </svg>
          </button>
        </div>
      )} */}

      {/* Loading Overlay */}
      {isLoadingProduct && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-4 flex items-center space-x-3 mx-4">
            <div className="animate-spin w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full"></div>
            <span className="text-gray-900 font-medium">
              กำลังค้นหาสินค้า...
            </span>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {productError && (
        <div className="absolute top-4 left-4 right-4 z-40">
          <div className="bg-red-100 border border-red-300 rounded-lg p-4">
            <div className="text-red-800 text-sm font-medium">
              {productError}
            </div>
          </div>
        </div>
      )}

      {/* Success Detection Feedback */}
      {lastDetectedCode && !productError && (
        <div className="absolute top-4 left-4 right-4 z-40">
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

      {/* Scan Instructions */}
      {/* {isStreaming && !product && !isLoadingProduct && (
        <div className="absolute bottom-20 left-4 right-4 z-30">
          <div className="bg-black/70 backdrop-blur-sm rounded-lg p-4">
            <div className="text-white text-center">
              <div className="text-lg font-medium mb-1">วางบาร์โค้ดในกรอบ</div>
              <div className="text-sm opacity-90">
                เครื่องจะสแกนโดยอัตโนมัติ
              </div>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
};
