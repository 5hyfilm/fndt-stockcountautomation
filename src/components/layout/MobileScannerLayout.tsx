// Path: src/components/layout/MobileScannerLayout.tsx
"use client";

import React, { useEffect, useState } from "react";
import { CameraSection } from "../CameraSection";
import { MobileProductSlide } from "./MobileProductSlide";
import { Detection } from "../../hooks/detection/types";
import { Product } from "../../types/product";

interface MobileScannerLayoutProps {
  // Camera props
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  containerRef: React.RefObject<HTMLDivElement>;
  isStreaming: boolean;
  processingQueue: number;
  detections: Detection[];

  // Camera actions
  startCamera: () => void;
  stopCamera: () => void;
  switchCamera: () => void;
  captureAndProcess: () => void;
  drawDetections: () => void;
  updateCanvasSize: () => void;

  // ⭐ เพิ่ม torch props
  torchOn?: boolean;
  onToggleTorch?: () => void;

  // Product props
  product: Product | null;
  detectedBarcodeType?: "ea" | "dsp" | "cs" | null;
  isLoadingProduct: boolean;
  productError: string | null;
  lastDetectedCode: string;

  // Product actions
  onAddToInventory: (
    product: Product,
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

  // ⭐ รับ torch props
  torchOn = false,
  onToggleTorch,

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
          // ⭐ ส่ง torch props
          torchOn={torchOn}
          onToggleTorch={onToggleTorch}
        />
      </div>

      {/* ปุ่มควบคุมมุมบนขวา - เฉพาะเมื่อกล้องเปิดและไม่แสดง header */}
      {!showHeader && isStreaming && (
        <div className="absolute top-4 right-4 z-30 flex gap-2">
          {/* ปุ่มไฟฉาย */}
          {onToggleTorch && (
            <button
              onClick={onToggleTorch}
              className={`p-3 rounded-full shadow-lg transition-colors ${
                torchOn
                  ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                  : "bg-gray-800/70 hover:bg-gray-700 text-white"
              }`}
              title={torchOn ? "ปิดไฟฉาย" : "เปิดไฟฉาย"}
            >
              <svg
                width="24"
                height="24"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M6 14l3 3v5h6v-5l3-3V9H6v5zm5-12h2v3h-2V2zM3.5 6L2 4.5 3.5 3l1.5 1.5L3.5 6zm13 0L18 4.5 16.5 3 18 4.5 19.5 6zm-13 6L2 10.5 3.5 12 2 13.5 3.5 15zm13 0L18 10.5 16.5 12 18 13.5 16.5 15z" />
              </svg>
            </button>
          )}

          {/* ปุ่มปิดกล้อง */}
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
              className="bg-[rgb(162,193,82)] hover:bg-[rgb(142,173,62)] text-white px-8 py-4 rounded-full text-lg font-medium shadow-xl transition-colors mb-4"
            >
              <div className="flex items-center gap-3">
                <svg
                  width="32"
                  height="32"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 2h6v6h4v2h2v8c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2v-8h2V8h4V2zm2 2v4h2V4h-2z" />
                </svg>
                เปิดกล้อง
              </div>
            </button>
            <p className="text-white/70 text-sm">แตะเพื่อเริ่มสแกนบาร์โค้ด</p>
          </div>
        </div>
      )}

      {/* Product Slide Overlay */}
      <MobileProductSlide
        isVisible={showProductSlide}
        product={product}
        detectedBarcodeType={detectedBarcodeType}
        currentInventoryQuantity={currentInventoryQuantity}
        onClose={handleCloseProductSlide}
        onAddToInventory={onAddToInventory}
      />
    </div>
  );
};
