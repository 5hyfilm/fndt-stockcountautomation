// src/components/Scanner.tsx - Improved scanner with better loading states and stability
"use client";

import React, { useEffect, useState } from "react";
import { useBarcodeDetection } from "../hooks/useBarcodeDetection";
import { BarcodeScanLoadingIndicator } from "./LoadingIndicator";

interface ScannerProps {
  onBarcodeDetected?: (barcode: string) => void;
  onProductFound?: (product: any, barcodeType: string) => void;
  showProductInfo?: boolean;
  className?: string;
}

export const Scanner: React.FC<ScannerProps> = ({
  onBarcodeDetected,
  onProductFound,
  showProductInfo = true,
  className = "",
}) => {
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
    product,
    detectedBarcodeType,
    isLoadingProduct,
    productError,
    startCamera,
    stopCamera,
    switchCamera,
    captureAndProcess,
    drawDetections,
    updateCanvasSize,
    clearError,
    clearProduct,
  } = useBarcodeDetection();

  // Local state for tracking scanning stages
  const [scanningStage, setScanningStage] = useState<
    "scanning" | "processing" | "searching" | "found" | "not-found"
  >("scanning");

  // Auto-start camera on mount
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => updateCanvasSize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateCanvasSize]);

  // Update scanning stage based on states
  useEffect(() => {
    if (processingQueue > 0) {
      setScanningStage("processing");
    } else if (isLoadingProduct) {
      setScanningStage("searching");
    } else if (product) {
      setScanningStage("found");
    } else if (productError) {
      setScanningStage("not-found");
    } else {
      setScanningStage("scanning");
    }
  }, [processingQueue, isLoadingProduct, product, productError]);

  // Auto-process frames for continuous scanning
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      captureAndProcess();
    }, 300); // Process every 300ms for better performance

    return () => clearInterval(interval);
  }, [isStreaming, captureAndProcess]);

  // Draw detections when they change
  useEffect(() => {
    drawDetections();
  }, [detections, product, detectedBarcodeType, drawDetections]);

  // Callback when barcode is detected
  useEffect(() => {
    if (lastDetectedCode && onBarcodeDetected) {
      onBarcodeDetected(lastDetectedCode);
    }
  }, [lastDetectedCode, onBarcodeDetected]);

  // Callback when product is found
  useEffect(() => {
    if (product && detectedBarcodeType && onProductFound) {
      onProductFound(product, detectedBarcodeType);
    }
  }, [product, detectedBarcodeType, onProductFound]);

  const handleRetry = () => {
    clearError();
    clearProduct();
    if (!isStreaming) {
      startCamera();
    } else {
      captureAndProcess();
    }
  };

  const getUnitTypeText = (type: string) => {
    const types = {
      ea: "ชิ้น (Each)",
      dsp: "แพ็ค (Display Pack)",
      cs: "ลัง (Case/Carton)",
    };
    return types[type as keyof typeof types] || type;
  };

  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`}>
      {/* Camera Container */}
      <div
        ref={containerRef}
        className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-xl"
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          onLoadedMetadata={() => {
            updateCanvasSize();
          }}
        />

        {/* Detection Canvas Overlay */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* Loading/Status Overlay */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
          <BarcodeScanLoadingIndicator
            isLoading={
              isStreaming &&
              (processingQueue > 0 ||
                isLoadingProduct ||
                scanningStage !== "scanning")
            }
            stage={scanningStage}
          />
        </div>

        {/* Camera Controls */}
        <div className="absolute top-4 right-4 flex space-x-2">
          <button
            onClick={switchCamera}
            disabled={!isStreaming}
            className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition-colors disabled:opacity-50"
            title="เปลี่ยนกล้อง"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
          </button>

          <button
            onClick={handleRetry}
            className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
            title="สแกนใหม่"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        {/* Stats Overlay (Debug Info) */}
        {stats.fps > 0 && (
          <div className="absolute bottom-4 left-4 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
            <div>FPS: {stats.fps}</div>
            <div>Queue: {processingQueue}</div>
            {stats.confidence > 0 && (
              <div>Conf: {(stats.confidence * 100).toFixed(1)}%</div>
            )}
          </div>
        )}

        {/* Error Display */}
        {errors && (
          <div className="absolute inset-4 flex items-center justify-center">
            <div className="bg-red-500/90 text-white p-4 rounded-lg text-center backdrop-blur-sm">
              <div className="text-lg font-semibold mb-2">เกิดข้อผิดพลาด</div>
              <div className="mb-4">{errors}</div>
              <button
                onClick={handleRetry}
                className="bg-white text-red-500 px-4 py-2 rounded hover:bg-gray-100 transition-colors"
              >
                ลองใหม่
              </button>
            </div>
          </div>
        )}

        {/* No Camera Stream */}
        {!isStreaming && !errors && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center text-white">
              <div className="text-6xl mb-4">📷</div>
              <div className="text-xl mb-4">เปิดกล้องเพื่อสแกนบาร์โค้ด</div>
              <button
                onClick={startCamera}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors"
              >
                เริ่มสแกน
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Product Information Display */}
      {showProductInfo && (
        <div className="mt-6 space-y-4">
          {/* Last Detected Barcode */}
          {lastDetectedCode && (
            <div className="bg-gray-100 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">บาร์โค้ดที่สแกน</div>
              <div className="font-mono text-lg text-gray-800">
                {lastDetectedCode}
              </div>
            </div>
          )}

          {/* Product Found */}
          {product && detectedBarcodeType && (
            <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-green-800">
                  ✅ พบสินค้าแล้ว!
                </h3>
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {getUnitTypeText(detectedBarcodeType)}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">
                    {product.name}
                  </h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>
                      <strong>ชื่อภาษาอังกฤษ:</strong> {product.name_en || "-"}
                    </div>
                    <div>
                      <strong>แบรนด์:</strong> {product.brand}
                    </div>
                    <div>
                      <strong>รหัสสินค้า:</strong> {product.sku}
                    </div>
                    <div>
                      <strong>ขนาด:</strong> {product.size} {product.unit}
                    </div>
                    <div>
                      <strong>หมวดหมู่:</strong> {product.category}
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold text-gray-800 mb-2">
                    ข้อมูลบาร์โค้ด
                  </h5>
                  <div className="space-y-1 text-sm text-gray-600">
                    {product.barcodes?.ea && (
                      <div>
                        <strong>EA:</strong> <code>{product.barcodes.ea}</code>
                      </div>
                    )}
                    {product.barcodes?.dsp && (
                      <div>
                        <strong>DSP:</strong>{" "}
                        <code>{product.barcodes.dsp}</code>
                      </div>
                    )}
                    {product.barcodes?.cs && (
                      <div>
                        <strong>CS:</strong> <code>{product.barcodes.cs}</code>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {product.storage_instructions && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-800">
                    <strong>การเก็บรักษา:</strong>{" "}
                    {product.storage_instructions}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Product Not Found */}
          {productError && !product && lastDetectedCode && (
            <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-red-800">
                  ❌ ไม่พบข้อมูลสินค้า
                </h3>
                <button
                  onClick={handleRetry}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  สแกนใหม่
                </button>
              </div>

              <div className="text-red-700 mb-3">{productError}</div>

              <div className="bg-white p-3 rounded border border-red-200">
                <div className="text-sm text-gray-600 mb-1">
                  บาร์โค้ดที่สแกน:
                </div>
                <div className="font-mono text-gray-800">
                  {lastDetectedCode}
                </div>
              </div>

              <div className="mt-4 text-sm text-red-600">
                💡 กรุณาตรวจสอบว่าบาร์โค้ดถูกต้องและสินค้านี้มีอยู่ในระบบ
              </div>
            </div>
          )}

          {/* Clear Button */}
          {(product || productError) && (
            <div className="flex justify-center">
              <button
                onClick={() => {
                  clearProduct();
                  clearError();
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                ล้างข้อมูล
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
