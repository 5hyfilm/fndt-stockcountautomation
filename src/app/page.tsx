// Path: src/app/page.tsx
// Phase 3: Updated with separate unit storage and enhanced barcode type detection

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
import { ProductInfo } from "../components/ProductInfo"; // ✅ NEW: Use updated ProductInfo

// ✅ UPDATED: Import new types
import { Product, ProductStatus, BarcodeType } from "../types/product";
import { ProductWithMultipleBarcodes } from "../data/types/csvTypes";
import {
  InventoryOperationResult,
  InventoryUtils,
} from "../hooks/inventory/types";

// ✅ Import utility functions from csvTypes
import {
  getProductCategoryFromGroup,
  isValidProductGroup,
} from "../data/types/csvTypes";

// Import new sub-components
import { MobileAppHeader } from "../components/headers/MobileAppHeader";
import { DesktopAppHeader } from "../components/headers/DesktopAppHeader";
import { AppFooter } from "../components/footer/AppFooter";
import { QuickStats } from "../components/stats/QuickStats";

// Import updated layout components
import { MobileScannerLayout } from "../components/layout/MobileScannerLayout";

// Import logout confirmation
import { LogoutConfirmationModal } from "../components/modals/LogoutConfirmationModal";
import { useLogoutConfirmation } from "../hooks/useLogoutConfirmation";

// ✅ Import AddNewProductForm
import { AddNewProductForm } from "../components/forms/AddNewProductForm";

export default function BarcodeDetectionPage() {
  const [activeTab, setActiveTab] = useState<"scanner" | "inventory">(
    "scanner"
  );
  const [showExportSuccess, setShowExportSuccess] = useState(false);
  const [exportFileName, setExportFileName] = useState<string>("");
  const [isMobile, setIsMobile] = useState(false);
  const [fullScreenMode, setFullScreenMode] = useState(false);

  // ✅ State สำหรับ AddNewProductForm
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [newProductBarcode, setNewProductBarcode] = useState<string>("");

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

  // ✅ UPDATED: Enhanced Barcode Detection with new types
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
    detectedBarcodeType, // ✅ Now returns BarcodeType | null
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
    // ✅ NEW: Enhanced debugging
    getDebugInfo,
  } = useBarcodeDetection();

  useEffect(() => {
    // หยุดกล้องเมื่อไม่ได้อยู่ใน scanner tab
    if (activeTab !== "scanner" && isStreaming) {
      console.log("🔄 Switching away from scanner tab, stopping camera...");
      stopCamera();
    }
  }, [activeTab, isStreaming, stopCamera]);

  // ✅ ENHANCED: Logging with new barcode type system
  useEffect(() => {
    console.log("🏷️ Detected Barcode Type:", detectedBarcodeType || "None");
    console.log("📦 Product:", product?.name || "No product");
    console.log("📱 Last Detected Code:", lastDetectedCode);

    if (process.env.NODE_ENV === "development" && getDebugInfo) {
      console.log("🔧 Debug Info:", getDebugInfo());
    }
    console.log("---");
  }, [detectedBarcodeType, product, lastDetectedCode, getDebugInfo]);

  // ✅ UPDATED: Enhanced Inventory Management with new system
  const {
    inventory,
    groupedInventory, // ✅ NEW: For table view
    isLoading: isLoadingInventory,
    error: inventoryError,
    summary,
    addOrUpdateItem,
    updateItemQuantity, // ✅ UPDATED: New signature
    removeItem,
    removeProduct, // ✅ NEW: Remove entire product
    clearInventory,
    findItemByBarcode,
    searchItems,
    searchGroupedItems, // ✅ NEW: Search grouped items
    exportInventory,
    clearError: clearInventoryError,
    resetInventoryState,
    // ✅ NEW: Debug utilities
    getDebugInfo: getInventoryDebugInfo,
    validateInventoryData,
  } = useInventoryManager(
    employee
      ? {
          employeeName: employee.employeeName,
          branchCode: employee.branchCode,
          branchName: employee.branchName,
        }
      : undefined
  );

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

  // ✅ UPDATED: Find current inventory quantity (ปรับให้ทำงานกับ grouped system)
  const currentInventoryQuantity = React.useMemo(() => {
    if (!lastDetectedCode || !detectedBarcodeType) return 0;

    // Find item by barcode and type
    const item = findItemByBarcode(lastDetectedCode, detectedBarcodeType);
    return item?.quantity || 0;
  }, [lastDetectedCode, detectedBarcodeType, findItemByBarcode]);

  // ✅ MAJOR UPDATE: Simplified add to inventory with new system
  const handleAddToInventory = (
    product: Product | ProductWithMultipleBarcodes,
    quantity: number, // ✅ SIMPLIFIED: Just number
    barcodeType: BarcodeType // ✅ UPDATED: Use BarcodeType enum
  ): boolean => {
    console.log("🔄 handleAddToInventory called with:");
    console.log("  📦 Product:", product?.name);
    console.log("  🔢 Quantity:", quantity);
    console.log("  🏷️ BarcodeType:", barcodeType);

    // ✅ Use new simplified signature
    const result: InventoryOperationResult = addOrUpdateItem(
      product as Product,
      quantity,
      barcodeType
    );

    if (result.success && employee) {
      const unitLabel =
        barcodeType === BarcodeType.CS
          ? "ลัง"
          : barcodeType === BarcodeType.DSP
          ? "แพ็ค"
          : "ชิ้น";

      console.log(
        `✅ Added ${quantity} ${unitLabel} of ${
          product?.name
        } (${barcodeType.toUpperCase()})`
      );
    } else if (!result.success) {
      console.error("❌ Failed to add to inventory:", result.error);
    }

    return result.success;
  };

  // ✅ New handler สำหรับเพิ่มสินค้าใหม่
  const handleAddNewProduct = (barcode: string) => {
    console.log("🆕 Add new product requested for barcode:", barcode);

    // เปิด form และเก็บ barcode
    setNewProductBarcode(barcode);
    setShowAddProductForm(true);
  };

  // ✅ UPDATED: Handler for saving new product with simplified system
  const handleSaveNewProduct = async (productData: {
    barcode: string;
    productName: string;
    productGroup: string;
    description: string;
    countCs: number;
    countPieces: number;
  }): Promise<boolean> => {
    try {
      console.log("💾 Saving new product:", productData);

      // ✅ Validate product group
      if (!isValidProductGroup(productData.productGroup)) {
        console.error("❌ Invalid product group:", productData.productGroup);
        return false;
      }

      // ✅ Create Product object
      const newProduct: Product = {
        id: `new_${productData.barcode}`,
        name: productData.productName,
        brand: "เพิ่มใหม่",
        category: getProductCategoryFromGroup(productData.productGroup),
        barcode: productData.barcode,
        description: productData.description,
        price: 0,
        status: ProductStatus.ACTIVE,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      let success = false;

      // ✅ SIMPLIFIED: Add separate records for CS and EA
      if (productData.countCs > 0) {
        const csResult = addOrUpdateItem(
          newProduct,
          productData.countCs,
          BarcodeType.CS,
          productData.productGroup
        );
        if (csResult.success) {
          console.log(`✅ Added ${productData.countCs} ลัง (CS)`);
          success = true;
        }
      }

      if (productData.countPieces > 0) {
        const eaResult = addOrUpdateItem(
          newProduct,
          productData.countPieces,
          BarcodeType.EA,
          productData.productGroup
        );
        if (eaResult.success) {
          console.log(`✅ Added ${productData.countPieces} ชิ้น (EA)`);
          success = true;
        }
      }

      if (success) {
        console.log("✅ New product saved successfully");

        // ปิด form
        setShowAddProductForm(false);
        setNewProductBarcode("");

        // ปิด product slide และเริ่มสแกนใหม่
        restartForNextScan();

        return true;
      } else {
        console.error("❌ Failed to save new product - no quantities provided");
        return false;
      }
    } catch (error) {
      console.error("❌ Error saving new product:", error);
      return false;
    }
  };

  // ✅ Handler สำหรับปิด form
  const handleCloseAddProductForm = () => {
    setShowAddProductForm(false);
    setNewProductBarcode("");
  };

  // ✅ UPDATED: Handle update quantity (using new signature)
  const handleUpdateItemQuantity = (
    baseProductId: string,
    barcodeType: BarcodeType,
    newQuantity: number
  ): InventoryOperationResult => {
    console.log(
      `🔄 Updating ${barcodeType} quantity for ${baseProductId} to ${newQuantity}`
    );
    return updateItemQuantity(baseProductId, barcodeType, newQuantity);
  };

  // ✅ NEW: Handle remove entire product
  const handleRemoveProduct = (
    baseProductId: string
  ): InventoryOperationResult => {
    console.log(`🗑️ Removing entire product: ${baseProductId}`);
    return removeProduct(baseProductId);
  };

  // ✅ LEGACY: Handle remove individual item (for backward compatibility)
  const handleRemoveItem = (itemId: string): boolean => {
    console.log(`🗑️ Removing individual item: ${itemId}`);
    return removeItem(itemId);
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

  // ✅ NEW: Debug information
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("📊 Inventory Debug Info:", getInventoryDebugInfo?.());

      const validation = validateInventoryData?.();
      if (validation && !validation.isValid) {
        console.warn("⚠️ Inventory validation issues:", validation.errors);
      }
    }
  }, [inventory, getInventoryDebugInfo, validateInventoryData]);

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
            // ✅ UPDATED: Product props with new types
            product={product}
            detectedBarcodeType={detectedBarcodeType}
            isLoadingProduct={isLoadingProduct}
            productError={productError}
            lastDetectedCode={lastDetectedCode}
            scannedBarcode={lastDetectedCode}
            // Product actions
            onAddToInventory={handleAddToInventory} // ✅ Updated signature
            onAddNewProduct={handleAddNewProduct}
            restartForNextScan={restartForNextScan}
            currentInventoryQuantity={currentInventoryQuantity}
            // Layout options
            fullScreen={true}
            showHeader={false}
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

        {/* ✅ Add New Product Form */}
        <AddNewProductForm
          isVisible={showAddProductForm}
          barcode={newProductBarcode}
          onClose={handleCloseAddProductForm}
          onSave={handleSaveNewProduct}
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
              /* ✅ UPDATED: Mobile Layout with new ProductInfo */
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
                // ✅ UPDATED: Product props with new types
                product={product}
                detectedBarcodeType={detectedBarcodeType}
                isLoadingProduct={isLoadingProduct}
                productError={productError}
                lastDetectedCode={lastDetectedCode}
                scannedBarcode={lastDetectedCode}
                // Product actions
                onAddToInventory={handleAddToInventory} // ✅ Updated signature
                onAddNewProduct={handleAddNewProduct}
                restartForNextScan={restartForNextScan}
                currentInventoryQuantity={currentInventoryQuantity}
                // Layout options
                fullScreen={false}
                showHeader={true}
              />
            ) : (
              /* ✅ UPDATED: Desktop Layout with new ProductInfo */
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

                  {/* ✅ UPDATED: Product Info Sidebar with new component */}
                  <div className="xl:col-span-2 space-y-4">
                    <ProductInfo
                      product={product}
                      barcode={lastDetectedCode}
                      detectedBarcodeType={detectedBarcodeType}
                      isLoading={isLoadingProduct}
                      error={productError || undefined}
                      currentInventoryQuantity={currentInventoryQuantity}
                      scannedBarcode={lastDetectedCode}
                      onAddToInventory={handleAddToInventory} // ✅ Updated signature
                      fullScreen={false}
                      showHeader={true}
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

        {/* ✅ UPDATED: Inventory Tab with new table view */}
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
                groupedInventory={groupedInventory} // ✅ NEW: Grouped data
                summary={summary}
                isLoading={isLoadingInventory}
                error={inventoryError}
                onUpdateQuantity={handleUpdateItemQuantity} // ✅ NEW: Updated signature
                onRemoveItem={handleRemoveItem} // ✅ Legacy support
                onRemoveProduct={handleRemoveProduct} // ✅ NEW: Remove entire product
                onClearInventory={clearInventory}
                onExportInventory={handleExportInventory}
                onClearError={clearInventoryError}
                onSearch={searchItems}
                onSearchGrouped={searchGroupedItems} // ✅ NEW: Grouped search
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

      {/* ✅ Add New Product Form */}
      <AddNewProductForm
        isVisible={showAddProductForm}
        barcode={newProductBarcode}
        onClose={handleCloseAddProductForm}
        onSave={handleSaveNewProduct}
      />
    </div>
  );
}
