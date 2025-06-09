// src/app/page.tsx - Updated Version with Inventory Management
"use client";

import React, { useEffect, useState } from "react";
import {
  Camera,
  Sparkles,
  Package,
  Info,
  History,
  Settings,
} from "lucide-react";
import Image from "next/image";
import { useBarcodeDetection } from "../hooks/useBarcodeDetection";
import { useInventory } from "../hooks/useInventory";
import { CameraSection } from "../components/CameraSection";
import { DetectionsList } from "../components/DetectionsList";
import { ProductInfo } from "../components/ProductInfo";
import { QuantityInput } from "../components/QuantityInput";
import { SessionManager } from "../components/SessionManager";
import { InventoryHistory } from "../components/InventoryHistory";
import { ScanStatusDisplay } from "../components/ScanStatusDisplay";
import { ErrorDisplay } from "../components/ErrorDisplay";

export default function BarcodeDetectionPage() {
  const [activeTab, setActiveTab] = useState<"scan" | "history" | "session">(
    "scan"
  );
  const [showQuantityInput, setShowQuantityInput] = useState(false);

  const {
    videoRef,
    canvasRef,
    containerRef,
    isStreaming,
    detections,
    processingQueue,
    lastDetectedCode,
    errors,
    product,
    isLoadingProduct,
    productError,
    startCamera,
    stopCamera,
    switchCamera,
    captureAndProcess,
    drawDetections,
    updateCanvasSize,
    clearError,
  } = useBarcodeDetection();

  const {
    saveInventoryItem,
    currentSession,
    hasActiveSession,
    isLoading: isInventoryLoading,
    error: inventoryError,
    clearError: clearInventoryError,
  } = useInventory();

  // ประมวลผลอัตโนมัติ Real-time
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isStreaming && !showQuantityInput) {
      interval = setInterval(() => {
        captureAndProcess();
      }, 300);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStreaming, captureAndProcess, showQuantityInput]);

  // แสดง QuantityInput เมื่อสแกนสินค้าสำเร็จ
  useEffect(() => {
    if (product && lastDetectedCode && !showQuantityInput) {
      setShowQuantityInput(true);
    }
  }, [product, lastDetectedCode, showQuantityInput]);

  // Handle saving inventory
  const handleSaveInventory = async (
    quantity: number,
    unit: "ea" | "dsp" | "cs",
    notes?: string
  ) => {
    if (!product) return;

    try {
      const result = await saveInventoryItem(product, quantity, unit, notes);

      if (result.success) {
        console.log("✅ Inventory saved successfully");
        // Reset the scanning state
        setShowQuantityInput(false);
        // Continue scanning for next item
      } else {
        console.error("❌ Failed to save inventory:", result.error);
      }
    } catch (error) {
      console.error("❌ Error saving inventory:", error);
    }
  };

  const handleClearAllErrors = () => {
    clearError();
    clearInventoryError();
  };

  const handleCancelQuantityInput = () => {
    setShowQuantityInput(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4">
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
                  <span className="fn-gradient-text">ระบบตรวจจับ Barcode</span>
                  <Sparkles className="fn-red" size={20} />
                </h1>
                <p className="text-gray-600 text-sm mt-2">
                  F&N Inventory Tracking & Product Information
                </p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center">
            <div className="bg-gray-100 rounded-xl p-1 flex">
              <button
                onClick={() => setActiveTab("scan")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "scan"
                    ? "bg-white text-fn-green shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <Camera size={16} className="inline mr-2" />
                สแกน
              </button>
              <button
                onClick={() => setActiveTab("session")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "session"
                    ? "bg-white text-fn-green shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <Settings size={16} className="inline mr-2" />
                เซชัน
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "history"
                    ? "bg-white text-fn-green shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <History size={16} className="inline mr-2" />
                ประวัติ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-4 sm:py-6">
        {/* Error Display */}
        {(errors || productError || inventoryError) && (
          <div className="mb-4">
            <ErrorDisplay
              error={errors || productError || inventoryError || ""}
              onDismiss={handleClearAllErrors}
              onRetry={() => {
                handleClearAllErrors();
                if (!isStreaming) startCamera();
              }}
            />
          </div>
        )}

        {/* Session Warning */}
        {activeTab === "scan" && !hasActiveSession && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-amber-800">
              <Info size={16} />
              <span className="text-sm">
                <strong>แนะนำ:</strong>{" "}
                สร้างเซชันใหม่ก่อนเริ่มสแกนเพื่อจัดกลุ่มข้อมูล
              </span>
              <button
                onClick={() => setActiveTab("session")}
                className="ml-auto bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded text-sm"
              >
                สร้างเซชัน
              </button>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === "scan" && (
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 lg:gap-6">
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

            {/* Results Sidebar */}
            <div className="xl:col-span-2 space-y-4">
              {/* Quantity Input (if product scanned) */}
              {showQuantityInput && product ? (
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="fn-green" size={20} />
                      <h3 className="text-lg font-semibold text-gray-900">
                        บันทึกจำนวน
                      </h3>
                    </div>
                    <button
                      onClick={handleCancelQuantityInput}
                      className="text-gray-500 hover:text-gray-700 text-sm"
                    >
                      ข้าม
                    </button>
                  </div>

                  <QuantityInput
                    product={product}
                    onSave={handleSaveInventory}
                    isLoading={isInventoryLoading}
                  />
                </div>
              ) : (
                /* Product Information */
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <Package className="fn-green" size={20} />
                    <h3 className="text-lg font-semibold text-gray-900">
                      ข้อมูลสินค้า
                    </h3>
                    {isLoadingProduct && (
                      <div className="animate-spin w-4 h-4 border-2 border-fn-green border-t-transparent rounded-full"></div>
                    )}
                  </div>

                  <ProductInfo
                    product={product}
                    barcode={lastDetectedCode}
                    isLoading={isLoadingProduct}
                    error={productError || undefined}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "session" && (
          <div className="max-w-2xl mx-auto">
            <SessionManager />
          </div>
        )}

        {activeTab === "history" && (
          <div className="max-w-4xl mx-auto">
            <InventoryHistory showFilters={true} showSession={true} />
          </div>
        )}

        {/* Instructions for Scan Tab */}
        {activeTab === "scan" && (
          <div className="mt-6 bg-white rounded-lg p-4 text-center border border-gray-200 shadow-sm">
            <h4 className="font-medium text-gray-900 mb-2">
              💡 วิธีใช้งานระบบ
            </h4>
            <div className="text-sm text-gray-600 space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <span>เริ่มกล้องและสแกน barcode</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-green-100 text-green-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <span>กรอกจำนวนสินค้าที่พบ</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-purple-100 text-purple-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <span>บันทึกและสแกนต่อ</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Stats - Desktop Only */}
        <div className="hidden xl:block mt-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold fn-green">6</div>
                <div className="text-xs text-gray-600">สินค้า F&N</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">4</div>
                <div className="text-xs text-gray-600">หมวดหมู่</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">3</div>
                <div className="text-xs text-gray-600">แบรนด์</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {hasActiveSession ? "🟢" : "🔴"}
                </div>
                <div className="text-xs text-gray-600">
                  {hasActiveSession ? "เซชันทำงาน" : "ไม่มีเซชัน"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white/80 border-t border-gray-200 mt-8 shadow-sm">
        <div className="container mx-auto px-4 py-4 text-center">
          <p className="text-xs sm:text-sm text-gray-600">
            F&N Quality Control System | ระบบตรวจจับ Barcode พร้อมการจัดการสต็อก
            |
            <span className="fn-green font-medium">
              {" "}
              พัฒนาด้วย Next.js & AI
            </span>
          </p>
          {currentSession && (
            <p className="text-xs text-gray-500 mt-1">
              🎯 เซชันปัจจุบัน: {currentSession.name} (
              {currentSession.totalItems} รายการ)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
