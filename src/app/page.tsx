// src/app/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useBarcodeDetection } from "../hooks/useBarcodeDetection";
import { useInventoryManager } from "../hooks/useInventoryManager";
import { useEmployeeAuth } from "../hooks/useEmployeeAuth";
import {
  EmployeeBranchForm,
  EmployeeInfo,
} from "../components/auth/EmployeeBranchForm";
import { CameraSection } from "../components/CameraSection";
import { InventoryDisplay } from "../components/InventoryDisplay";
import { ErrorDisplay } from "../components/ErrorDisplay";
import { ExportSuccessToast } from "../components/ExportSuccessToast";

// Import new sub-components
import { MobileAppHeader } from "../components/headers/MobileAppHeader";
import { DesktopAppHeader } from "../components/headers/DesktopAppHeader";
import { AppFooter } from "../components/footer/AppFooter";
import { QuickStats } from "../components/stats/QuickStats";
import { ProductInfoSection } from "../components/sections/ProductInfoSection";

export default function BarcodeDetectionPage() {
  const [activeTab, setActiveTab] = useState<"scanner" | "inventory">(
    "scanner"
  );
  const [showExportSuccess, setShowExportSuccess] = useState(false);
  const [exportFileName, setExportFileName] = useState<string>("");
  const [isMobile, setIsMobile] = useState(false);

  // New state for mobile scanner enhancement
  const [showProductSlide, setShowProductSlide] = useState(false);
  const [cameraState, setCameraState] = useState<"scanning" | "found" | "idle">(
    "idle"
  );

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Employee Authentication
  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    employee,
    employeeName,
    branchCode,
    branchName,
    login,
    logout,
    formatTimeRemaining,
  } = useEmployeeAuth();

  // Barcode Detection
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
  } = useBarcodeDetection();

  // Enhanced product detection handler for mobile
  useEffect(() => {
    console.log("🏷️ Detected Barcode Type:", detectedBarcodeType);
    console.log("📦 Product:", product?.name || "No product");
    console.log("📱 Last Detected Code:", lastDetectedCode);
    console.log("📱 Mobile Mode:", isMobile);
    console.log("---");

    // Mobile-specific behavior: Auto-stop camera and show product slide when product is found
    if (isMobile && product && !isLoadingProduct && !productError) {
      // Stop camera automatically when product is detected
      if (isStreaming && cameraState === "scanning") {
        console.log(
          "🎯 Product detected in mobile mode - stopping camera and showing slide"
        );
        setCameraState("found");
        setShowProductSlide(true);

        // Stop camera with slight delay for smooth UX
        setTimeout(() => {
          stopCamera();
        }, 500);
      }
    }
  }, [
    detectedBarcodeType,
    product,
    lastDetectedCode,
    isMobile,
    isLoadingProduct,
    productError,
    isStreaming,
    cameraState,
    stopCamera,
  ]);

  // Handle camera state changes
  useEffect(() => {
    if (isStreaming && cameraState !== "scanning") {
      setCameraState("scanning");
      setShowProductSlide(false);
    } else if (!isStreaming && cameraState === "scanning") {
      setCameraState("idle");
    }
  }, [isStreaming, cameraState]);

  // Enhanced camera controls for mobile
  const handleStartCamera = () => {
    setShowProductSlide(false);
    setCameraState("scanning");
    startCamera();
  };

  const handleStopCamera = () => {
    setCameraState("idle");
    setShowProductSlide(false);
    stopCamera();
  };

  const handleScanAgain = () => {
    setShowProductSlide(false);
    setCameraState("scanning");
    startCamera();
  };

  // Rest of your existing hooks and logic...
  const {
    inventory,
    isLoading: isLoadingInventory,
    error: inventoryError,
    addOrUpdateItem,
    updateItemQuantity,
    removeItem,
    clearInventory,
    findItemByBarcode,
    searchItems,
    exportInventory,
    clearError: clearInventoryError,
    summary,
  } = useInventoryManager(
    employee
      ? `${employee.branchCode}_${employee.employeeName}`
      : "default_inventory"
  );

  // Get current inventory quantity for this product
  const currentInventoryQuantity = product
    ? findItemByBarcode(product.barcode)?.quantity || 0
    : 0;

  // Handle adding product to inventory
  const handleAddToInventory = (
    product: any,
    quantity: number,
    barcodeType?: "ea" | "dsp" | "cs"
  ): boolean => {
    try {
      const success = addOrUpdateItem(product, quantity, barcodeType);

      if (success && isMobile) {
        // On mobile, after adding to inventory, show option to scan again
        setTimeout(() => {
          setShowProductSlide(false);
          setCameraState("idle");
        }, 1000);
      }

      return success;
    } catch (error) {
      console.error("Error adding to inventory:", error);
      return false;
    }
  };

  // Export inventory with success feedback
  const handleExportInventory = async () => {
    try {
      const fileName = await exportInventory();
      setExportFileName(fileName);
      setShowExportSuccess(true);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  // Clear all errors
  const clearAllErrors = () => {
    clearError();
    clearInventoryError();
  };

  // Handle logout with cleanup
  const handleLogout = () => {
    if (isStreaming) stopCamera();
    clearInventory();
    logout();
  };

  // Show loading screen during authentication
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-fn-green border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังตรวจสอบข้อมูล...</p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <EmployeeBranchForm onSubmit={login} />
      </div>
    );
  }

  // Main application interface
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Export Success Toast */}
      {showExportSuccess && (
        <ExportSuccessToast
          fileName={exportFileName}
          onClose={() => setShowExportSuccess(false)}
        />
      )}

      {/* Header */}
      {isMobile ? (
        <MobileAppHeader
          employeeName={employeeName}
          activeTab={activeTab}
          totalProducts={summary.totalProducts}
          isStreaming={isStreaming}
          lastDetectedCode={lastDetectedCode}
          totalItems={summary.totalItems}
          onLogout={handleLogout}
          onTabChange={setActiveTab}
        />
      ) : (
        <DesktopAppHeader
          employeeName={employeeName}
          branchCode={branchCode}
          branchName={branchName}
          formatTimeRemaining={formatTimeRemaining}
          activeTab={activeTab}
          totalProducts={summary.totalProducts}
          isStreaming={isStreaming}
          lastDetectedCode={lastDetectedCode}
          product={product}
          totalItems={summary.totalItems}
          onLogout={handleLogout}
          onTabChange={setActiveTab}
        />
      )}

      {/* Main Content */}
      <div
        className={`${
          isMobile ? "px-2 py-3" : "container mx-auto px-4 py-4 sm:py-6"
        }`}
      >
        {/* Error Display */}
        {(errors || productError || inventoryError) && (
          <div className="mb-4">
            <ErrorDisplay
              error={errors || productError || inventoryError || ""}
              onDismiss={clearAllErrors}
              onRetry={() => {
                clearAllErrors();
                if (!isStreaming && activeTab === "scanner")
                  handleStartCamera();
              }}
            />
          </div>
        )}

        {/* Scanner Tab */}
        {activeTab === "scanner" && (
          <div
            className={`${
              isMobile
                ? "relative min-h-[80vh]" // Mobile uses relative positioning for overlay effect
                : "grid grid-cols-1 xl:grid-cols-5 gap-4 lg:gap-6"
            }`}
          >
            {/* Camera Section */}
            <div className={isMobile ? "relative" : "xl:col-span-3"}>
              <CameraSection
                videoRef={videoRef}
                canvasRef={canvasRef}
                containerRef={containerRef}
                isStreaming={isStreaming}
                processingQueue={processingQueue}
                detections={detections}
                startCamera={handleStartCamera}
                stopCamera={handleStopCamera}
                switchCamera={switchCamera}
                captureAndProcess={captureAndProcess}
                drawDetections={drawDetections}
                updateCanvasSize={updateCanvasSize}
              />
            </div>

            {/* Product Info Section - Desktop Sidebar or Mobile Slide Overlay */}
            <div
              className={
                isMobile
                  ? `fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 rounded-t-2xl shadow-2xl transition-transform duration-500 ease-out z-50 ${
                      showProductSlide
                        ? "transform translate-y-0"
                        : "transform translate-y-full"
                    }`
                  : "xl:col-span-2 space-y-4"
              }
            >
              {isMobile && (
                <>
                  {/* Mobile slide handle */}
                  <div className="flex justify-center pt-2 pb-1">
                    <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
                  </div>

                  {/* Mobile slide header */}
                  <div className="px-4 pb-2 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      ผลการสแกน
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={handleScanAgain}
                        className="px-3 py-1 bg-fn-green text-white rounded-lg text-sm font-medium"
                      >
                        สแกนใหม่
                      </button>
                      <button
                        onClick={() => setShowProductSlide(false)}
                        className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium"
                      >
                        ปิด
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div
                className={
                  isMobile ? "px-4 pb-4 max-h-[60vh] overflow-y-auto" : ""
                }
              >
                <ProductInfoSection
                  product={product}
                  barcode={lastDetectedCode}
                  barcodeType={detectedBarcodeType || undefined}
                  isLoading={isLoadingProduct}
                  error={productError || undefined}
                  currentInventoryQuantity={currentInventoryQuantity}
                  isMobile={isMobile}
                  onAddToInventory={handleAddToInventory}
                />
              </div>
            </div>
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === "inventory" && (
          <div className="space-y-6">
            <InventoryDisplay
              inventory={inventory}
              summary={summary}
              isLoading={isLoadingInventory}
              error={inventoryError}
              onUpdateQuantity={updateItemQuantity}
              onRemoveItem={removeItem}
              onClearInventory={clearInventory}
              onExportInventory={handleExportInventory}
              onClearError={clearInventoryError}
              onSearch={searchItems}
            />
          </div>
        )}

        {/* Quick Stats - Desktop Only */}
        {activeTab === "scanner" && !isMobile && (
          <QuickStats
            totalProducts={summary.totalProducts}
            totalItems={summary.totalItems}
            categories={summary.categories}
            product={product}
            currentInventoryQuantity={currentInventoryQuantity}
          />
        )}
      </div>

      {/* Footer - Hidden on mobile */}
      {!isMobile && (
        <AppFooter
          employeeName={employeeName}
          branchName={branchName}
          product={product}
          totalItems={summary.totalItems}
          lastUpdate={summary.lastUpdate}
        />
      )}

      {/* Mobile overlay backdrop when product slide is shown */}
      {isMobile && showProductSlide && (
        <div
          className="fixed inset-0 bg-black bg-opacity-25 z-40"
          onClick={() => setShowProductSlide(false)}
        />
      )}
    </div>
  );
}
