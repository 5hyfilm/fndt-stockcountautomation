// Path: src/app/page.tsx - Phase 2: Updated with Enhanced Quantity Support + Enhanced ProductNotFound
"use client";

import React, { useEffect, useState, useCallback } from "react"; // ✅ เพิ่ม useCallback
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

// Import Product type
import { Product } from "../types/product";

// ✅ Import new quantity types from Phase 2
import { QuantityInput, QuantityDetail } from "../hooks/inventory/types";

// Import new sub-components
import { MobileAppHeader } from "../components/headers/MobileAppHeader";
import { DesktopAppHeader } from "../components/headers/DesktopAppHeader";
import { AppFooter } from "../components/footer/AppFooter";
import { QuickStats } from "../components/stats/QuickStats";
import { ProductInfoSection } from "../components/sections/ProductInfoSection";

// Import updated layout components
import { MobileScannerLayout } from "../components/layout/MobileScannerLayout";

// Import logout confirmation
import { LogoutConfirmationModal } from "../components/modals/LogoutConfirmationModal";
import { useLogoutConfirmation } from "../hooks/useLogoutConfirmation";

export default function BarcodeDetectionPage() {
  const [activeTab, setActiveTab] = useState<"scanner" | "inventory">(
    "scanner"
  );
  const [showExportSuccess, setShowExportSuccess] = useState(false);
  const [exportFileName, setExportFileName] = useState<string>("");
  const [isMobile, setIsMobile] = useState(false);
  const [fullScreenMode, setFullScreenMode] = useState(false);

  // Detect mobile viewport and set full screen mode
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Auto enable full screen on mobile for scanner tab
      if (mobile && activeTab === "scanner") {
        setFullScreenMode(true);
      } else {
        setFullScreenMode(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [activeTab]);

  // Toggle full screen mode when tab changes
  useEffect(() => {
    if (isMobile && activeTab === "scanner") {
      setFullScreenMode(true);
    } else {
      setFullScreenMode(false);
    }
  }, [isMobile, activeTab]);

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
    restartForNextScan,
    torchOn,
    toggleTorch,
  } = useBarcodeDetection();

  useEffect(() => {
    // หยุดกล้องเมื่อไม่ได้อยู่ใน scanner tab
    if (activeTab !== "scanner" && isStreaming) {
      console.log("🔄 Switching away from scanner tab, stopping camera...");
      stopCamera();
    }
  }, [activeTab, isStreaming, stopCamera]);

  useEffect(() => {
    console.log("🏷️ Detected Barcode Type:", detectedBarcodeType);
    console.log("📦 Product:", product?.name || "No product");
    console.log("📱 Last Detected Code:", lastDetectedCode);
    console.log("---");
  }, [detectedBarcodeType, product, lastDetectedCode]);

  // ✅ Enhanced Inventory Management with Phase 2 support
  const {
    inventory,
    isLoading: isLoadingInventory,
    error: inventoryError,
    addOrUpdateItem,
    updateItemQuantity,
    updateItemQuantityDetail, // ✅ New method from Phase 2
    removeItem,
    clearInventory,
    findItemByBarcode,
    searchItems,
    exportInventory,
    clearError: clearInventoryError,
    resetInventoryState,
    summary,
  } = useInventoryManager(
    employee
      ? {
          employeeName: employee.employeeName,
          branchCode: employee.branchCode,
          branchName: employee.branchName,
        }
      : undefined
  );

  // ✅ Enhanced ProductNotFound Features - เพิ่มส่วนนี้
  // Handle when new product is added via modal
  const handleProductAdded = useCallback(
    (newProduct: Product) => {
      console.log("🎉 New product added successfully:", newProduct);

      // Log new product details
      console.log("New product details:", {
        name: newProduct.name,
        barcode: newProduct.barcode,
        brand: newProduct.brand,
        category: newProduct.category,
      });

      // Optionally restart scanner to scan again
      setTimeout(() => {
        restartForNextScan();
        if (!isStreaming) {
          startCamera();
        }
      }, 2000);
    },
    [restartForNextScan, startCamera, isStreaming]
  );

  // Handle rescan request
  const handleRescan = useCallback(() => {
    console.log("🔄 Rescanning requested...");

    // Clear current state and restart
    restartForNextScan();

    // Start camera if not already streaming
    setTimeout(() => {
      if (!isStreaming) {
        startCamera();
      }
    }, 300);
  }, [restartForNextScan, startCamera, isStreaming]);

  // Handle manual search request
  const handleManualSearch = useCallback(() => {
    console.log("🔍 Manual search requested for barcode:", lastDetectedCode);

    // For now, we'll just show an alert
    // In a real implementation, you might:
    // 1. Open a search modal
    // 2. Navigate to a search page
    // 3. Show a product lookup form

    const searchTerm =
      lastDetectedCode || prompt("ใส่บาร์โค้ดที่ต้องการค้นหา:");
    if (searchTerm) {
      alert(
        `กำลังค้นหา: ${searchTerm}\n(ฟีเจอร์นี้ยังไม่ได้ implement เต็มรูปแบบ)`
      );
    }
  }, [lastDetectedCode]);

  // Functions to check unsaved data for logout confirmation
  const hasUnsavedData = (): boolean => {
    return inventory.length > 0;
  };

  const getUnsavedDataCount = (): number => {
    return inventory.length;
  };

  // Handle logout with camera cleanup and inventory reset
  const handleLogout = () => {
    try {
      console.log("🚪 Starting logout process...");

      // Stop camera if running
      if (isStreaming) {
        console.log("📷 Stopping camera...");
        stopCamera();
      }

      // Reset inventory state first (clears memory state)
      console.log("📦 Resetting inventory state...");
      const resetSuccess = resetInventoryState();

      if (resetSuccess) {
        console.log("✅ Inventory state reset successfully");
      } else {
        console.warn(
          "⚠️ Inventory state reset had issues, continuing logout..."
        );
      }

      // Logout (clears localStorage and session)
      console.log("👋 Logging out...");
      logout();

      console.log("✅ Logout process completed");
    } catch (error) {
      console.error("❌ Error during logout process:", error);

      // Force logout even if there are errors
      try {
        resetInventoryState();
        logout();
        console.log("⚠️ Force logout completed despite errors");
      } catch (forceError) {
        console.error("❌ Even force logout failed:", forceError);
      }
    }
  };

  // Logout confirmation hook
  const {
    isModalOpen,
    showLogoutConfirmation,
    hideLogoutConfirmation,
    confirmLogout,
    hasUnsavedData: hasUnsaved,
    unsavedDataCount,
  } = useLogoutConfirmation({
    onLogout: handleLogout,
    hasUnsavedData,
    getUnsavedDataCount,
  });

  // Handle employee login
  const handleEmployeeLogin = async (employeeInfo: EmployeeInfo) => {
    try {
      await login(employeeInfo);
      console.log("✅ Employee logged in:", employeeInfo.employeeName);
    } catch (error) {
      console.error("❌ Login failed:", error);
    }
  };

  // ประมวลผลอัตโนมัติ Real-time
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isStreaming && activeTab === "scanner" && isAuthenticated) {
      interval = setInterval(() => {
        captureAndProcess();
      }, 300);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStreaming, activeTab, captureAndProcess, isAuthenticated]);

  // หาจำนวนสินค้าปัจจุบันใน inventory
  const currentInventoryQuantity = React.useMemo(() => {
    if (!lastDetectedCode) return 0;
    const item = findItemByBarcode(lastDetectedCode);
    return item?.quantity || 0;
  }, [lastDetectedCode, findItemByBarcode]);

  // ✅ Enhanced add to inventory with Phase 2 QuantityInput support
  const handleAddToInventory = (
    product: Product,
    quantityInput: QuantityInput, // ✅ Changed from 'quantity: number' to 'quantityInput: QuantityInput'
    barcodeType?: "ea" | "dsp" | "cs"
  ): boolean => {
    const finalBarcodeType = barcodeType || detectedBarcodeType || "ea";

    console.log("🔄 handleAddToInventory called with:");
    console.log("  📦 Product:", product?.name);
    console.log("  🔢 QuantityInput:", quantityInput); // ✅ Updated log
    console.log("  🏷️ BarcodeType received:", barcodeType);
    console.log("  🏷️ DetectedBarcodeType:", detectedBarcodeType);
    console.log("  🏷️ Final BarcodeType:", finalBarcodeType);

    // ✅ Use new signature with QuantityInput
    const success = addOrUpdateItem(product, quantityInput, finalBarcodeType);

    if (success && employee) {
      // ✅ Enhanced logging for different quantity types
      let logMessage = "";
      if (typeof quantityInput === "number") {
        const unitType =
          finalBarcodeType === "cs"
            ? "ลัง"
            : finalBarcodeType === "dsp"
            ? "แพ็ค"
            : "ชิ้น";
        logMessage = `${quantityInput} ${unitType}`;
      } else {
        const { major, remainder, scannedType } = quantityInput;
        const unitMap = { ea: "ชิ้น", dsp: "แพ็ค", cs: "ลัง" };
        logMessage = `${major} ${unitMap[scannedType]}`;
        if (remainder > 0) {
          logMessage += ` + ${remainder} ชิ้น`;
        }
      }

      console.log(
        `✅ Added ${logMessage} of ${
          product?.name
        } (${finalBarcodeType.toUpperCase()})`
      );
    }

    return success;
  };

  // ✅ Enhanced update quantity handler for Phase 2
  const handleUpdateItemQuantity = (
    itemId: string,
    newQuantity: number
  ): boolean => {
    return updateItemQuantity(itemId, newQuantity);
  };

  // ✅ New handler for updating quantity details (Phase 2)
  const handleUpdateItemQuantityDetail = (
    itemId: string,
    quantityDetail: QuantityDetail
  ): boolean => {
    if (updateItemQuantityDetail) {
      return updateItemQuantityDetail(itemId, quantityDetail);
    }
    // Fallback to simple quantity update for backward compatibility
    return updateItemQuantity(itemId, quantityDetail.major);
  };

  // Handle export with employee info
  const handleExportInventory = () => {
    if (!employee) return false;

    const success = exportInventory();
    if (success) {
      // Generate filename with employee and branch info
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];
      const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "-");
      const fileName = `FN_Stock_${branchCode}_${dateStr}_${timeStr}.csv`;

      setExportFileName(fileName);
      setShowExportSuccess(true);

      console.log(`📤 ${employeeName} exported inventory for ${branchName}`);
    }
    return success;
  };

  // Clear all errors
  const clearAllErrors = () => {
    clearError();
    clearInventoryError();
  };

  // Show login form if not authenticated
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg">
          <div className="animate-spin w-8 h-8 border-4 border-fn-green border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 text-center">กำลังโหลดระบบ...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <EmployeeBranchForm onSubmit={handleEmployeeLogin} />;
  }

  // Mobile Full Screen Scanner Mode
  if (isMobile && activeTab === "scanner" && fullScreenMode) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900">
        {/* Export Success Toast */}
        <ExportSuccessToast
          show={showExportSuccess}
          onClose={() => setShowExportSuccess(false)}
          fileName={exportFileName}
          itemCount={inventory.length}
        />

        {/* Header - แสดงปกติแม้ในโหมด full screen */}
        <MobileAppHeader
          employeeName={employeeName}
          activeTab={activeTab}
          totalProducts={summary.totalProducts}
          isStreaming={isStreaming}
          lastDetectedCode={lastDetectedCode}
          totalItems={summary.totalItems}
          onLogout={showLogoutConfirmation}
          onTabChange={setActiveTab}
        />

        {/* Main Content - Full Screen Scanner */}
        <div className="flex-1">
          <MobileScannerLayout
            // Camera props
            videoRef={videoRef}
            canvasRef={canvasRef}
            containerRef={containerRef}
            isStreaming={isStreaming}
            processingQueue={processingQueue}
            detections={detections}
            // Camera actions
            startCamera={startCamera}
            stopCamera={stopCamera}
            switchCamera={switchCamera}
            captureAndProcess={captureAndProcess}
            drawDetections={drawDetections}
            updateCanvasSize={updateCanvasSize}
            // Torch props
            torchOn={torchOn}
            onToggleTorch={toggleTorch}
            // Product props
            product={product}
            detectedBarcodeType={detectedBarcodeType}
            isLoadingProduct={isLoadingProduct}
            productError={productError}
            lastDetectedCode={lastDetectedCode}
            // Product actions
            onAddToInventory={handleAddToInventory} // ✅ Updated signature
            restartForNextScan={restartForNextScan}
            currentInventoryQuantity={currentInventoryQuantity}
            // Layout options
            fullScreen={true}
            showHeader={false}
            // ✅ Enhanced ProductNotFound props
            onProductAdded={handleProductAdded}
            onRescan={handleRescan}
            onManualSearch={handleManualSearch}
          />
        </div>

        {/* Logout Confirmation Modal */}
        <LogoutConfirmationModal
          isOpen={isModalOpen}
          onClose={hideLogoutConfirmation}
          onConfirm={confirmLogout}
          employeeName={employeeName}
          branchCode={branchCode}
          branchName={branchName}
          sessionTimeRemaining={formatTimeRemaining()}
          hasUnsavedData={hasUnsaved}
          unsavedDataCount={unsavedDataCount}
        />
      </div>
    );
  }

  // Regular Layout (Desktop or Mobile Inventory)
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Export Success Toast */}
      <ExportSuccessToast
        show={showExportSuccess}
        onClose={() => setShowExportSuccess(false)}
        fileName={exportFileName}
        itemCount={inventory.length}
      />

      {/* Header - Responsive */}
      {isMobile ? (
        <MobileAppHeader
          employeeName={employeeName}
          activeTab={activeTab}
          totalProducts={summary.totalProducts}
          isStreaming={isStreaming}
          lastDetectedCode={lastDetectedCode}
          totalItems={summary.totalItems}
          onLogout={showLogoutConfirmation}
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
          onLogout={showLogoutConfirmation}
          onTabChange={setActiveTab}
        />
      )}

      {/* Main Content */}
      <div className="flex-1">
        {/* Scanner Tab */}
        {activeTab === "scanner" && (
          <>
            {isMobile ? (
              /* Mobile Layout - Regular Scanner with Header (when not in full screen) */
              <MobileScannerLayout
                // Camera props
                videoRef={videoRef}
                canvasRef={canvasRef}
                containerRef={containerRef}
                isStreaming={isStreaming}
                processingQueue={processingQueue}
                detections={detections}
                // Camera actions
                startCamera={startCamera}
                stopCamera={stopCamera}
                switchCamera={switchCamera}
                captureAndProcess={captureAndProcess}
                drawDetections={drawDetections}
                updateCanvasSize={updateCanvasSize}
                // Torch props
                torchOn={torchOn}
                onToggleTorch={toggleTorch}
                // Product props
                product={product}
                detectedBarcodeType={detectedBarcodeType}
                isLoadingProduct={isLoadingProduct}
                productError={productError}
                lastDetectedCode={lastDetectedCode}
                // Product actions
                onAddToInventory={handleAddToInventory} // ✅ Updated signature
                restartForNextScan={restartForNextScan}
                currentInventoryQuantity={currentInventoryQuantity}
                // Layout options
                fullScreen={false}
                showHeader={true}
                // ✅ Enhanced ProductNotFound props
                onProductAdded={handleProductAdded}
                onRescan={handleRescan}
                onManualSearch={handleManualSearch}
              />
            ) : (
              /* Desktop Layout - Side by Side (คงเดิม) */
              <div className="container mx-auto px-4 py-4 sm:py-6">
                {/* Error Display - Desktop Only */}
                {(errors || productError || inventoryError) && (
                  <div className="mb-4">
                    <ErrorDisplay
                      error={errors || productError || inventoryError || ""}
                      onDismiss={clearAllErrors}
                      onRetry={() => {
                        clearAllErrors();
                        if (!isStreaming && activeTab === "scanner")
                          startCamera();
                      }}
                    />
                  </div>
                )}

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
                      fullScreen={false}
                      showHeader={true}
                      // Torch props
                      torchOn={torchOn}
                      onToggleTorch={toggleTorch}
                    />
                  </div>

                  {/* Product Info Sidebar */}
                  <div className="xl:col-span-2 space-y-4">
                    <ProductInfoSection
                      product={product}
                      barcode={lastDetectedCode}
                      barcodeType={detectedBarcodeType || undefined}
                      isLoading={isLoadingProduct}
                      error={productError || undefined}
                      currentInventoryQuantity={currentInventoryQuantity}
                      isMobile={false}
                      onAddToInventory={handleAddToInventory} // ✅ Updated signature
                      // ✅ Enhanced ProductNotFound props
                      onProductAdded={handleProductAdded}
                      onRescan={handleRescan}
                      onManualSearch={handleManualSearch}
                    />
                  </div>
                </div>

                {/* Quick Stats - Desktop Only */}
                <div className="mt-6">
                  <QuickStats
                    totalProducts={summary.totalProducts}
                    totalItems={summary.totalItems}
                    categories={summary.categories}
                    product={product}
                    currentInventoryQuantity={currentInventoryQuantity}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* Inventory Tab */}
        {activeTab === "inventory" && (
          <div
            className={`${
              isMobile ? "px-2 py-3" : "container mx-auto px-4 py-4 sm:py-6"
            }`}
          >
            {/* Error Display for Inventory */}
            {inventoryError && !isMobile && (
              <div className="mb-4">
                <ErrorDisplay
                  error={inventoryError}
                  onDismiss={clearInventoryError}
                  onRetry={clearInventoryError}
                />
              </div>
            )}

            <div className="space-y-6">
              <InventoryDisplay
                inventory={inventory}
                summary={summary}
                isLoading={isLoadingInventory}
                error={inventoryError}
                onUpdateQuantity={handleUpdateItemQuantity} // ✅ Updated handler
                onUpdateQuantityDetail={handleUpdateItemQuantityDetail} // ✅ New handler for Phase 2
                onRemoveItem={removeItem}
                onClearInventory={clearInventory}
                onExportInventory={handleExportInventory}
                onClearError={clearInventoryError}
                onSearch={searchItems}
              />
            </div>
          </div>
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

      {/* Logout Confirmation Modal */}
      <LogoutConfirmationModal
        isOpen={isModalOpen}
        onClose={hideLogoutConfirmation}
        onConfirm={confirmLogout}
        employeeName={employeeName}
        branchCode={branchCode}
        branchName={branchName}
        sessionTimeRemaining={formatTimeRemaining()}
        hasUnsavedData={hasUnsaved}
        unsavedDataCount={unsavedDataCount}
      />
    </div>
  );
}
