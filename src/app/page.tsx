// Path: src/app/page.tsx - Fixed: Remove totalSKUs props from AppHeader calls
"use client";

import React, { useEffect, useState } from "react";
import { useBarcodeDetection } from "../hooks/useBarcodeDetection";
import { useInventoryManager } from "../hooks/useInventoryManager";
import { useEmployeeAuth } from "../hooks/useEmployeeAuth";
// ✅ เพิ่ม import สำหรับ useInventoryExport - ใช้ direct import เพื่อหลีกเลี่ยง conflict
import { useInventoryExport } from "../hooks/inventory/useInventoryExport";
import {
  EmployeeBranchForm,
  EmployeeInfo,
} from "../components/auth/EmployeeBranchForm";
import { CameraSection } from "../components/CameraSection";
import { InventoryDisplay } from "../components/InventoryDisplay";
import { ErrorDisplay } from "../components/ErrorDisplay";
import { ExportSuccessToast } from "../components/ExportSuccessToast";

// Import Product type
import { Product, ProductStatus } from "../types/product";

// ✅ Import utility functions from csvTypes
import {
  getProductCategoryFromGroup,
  isValidProductGroup,
} from "../data/types/csvTypes";

// ✅ Import new quantity types from Phase 2
import { QuantityInput, QuantityDetail } from "../hooks/inventory/types";

// ✅ Import unified AppHeader instead of separate mobile/desktop components
import { AppHeader } from "../components/headers/AppHeader";
import { AppFooter } from "../components/footer/AppFooter";
import { QuickStats } from "../components/stats/QuickStats";
import { ProductInfoSection } from "../components/sections/ProductInfoSection";

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

  // ✅ State สำหรับ Export Error
  const [exportError, setExportError] = useState<string | null>(null);

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

  // ✅ FIXED: Modern Inventory Management (ไม่มี legacy methods)
  const {
    inventory,
    isLoading: isLoadingInventory,
    error: inventoryError,

    // ✅ Modern multi-unit methods only
    addOrUpdateMultiUnitItem,
    updateUnitQuantity,
    updateItemQuantityDetail,
    findItemByMaterialCode,
    findItemByBarcode,

    // Core methods (unchanged)
    removeItem,
    clearInventory,
    searchItems,
    clearError: clearInventoryError,
    resetInventoryState,
    summary,
  } = useInventoryManager();

  // ✅ เพิ่ม useInventoryExport hook สำหรับ export จริง
  const { exportInventory: performRealExport } = useInventoryExport({
    inventory,
    employeeContext: employee
      ? {
          employeeName: employee.employeeName,
          branchCode: employee.branchCode,
          branchName: employee.branchName,
        }
      : undefined,
    setError: setExportError, // ใช้ exportError state
  });

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

  // ✅ หาจำนวนสินค้าปัจจุบันใน inventory (รองรับ multi-unit)
  const currentInventoryQuantity = React.useMemo(() => {
    if (!lastDetectedCode || !product) return 0;

    // หาด้วย Material Code ก่อน (วิธีใหม่)
    const materialCode = product.id || product.barcode;
    const itemByMaterialCode = findItemByMaterialCode?.(materialCode);

    if (itemByMaterialCode) {
      // คืนค่าจำนวนรวมของหน่วยที่ตรงกับ detected barcode type
      const detectedUnit = detectedBarcodeType || "ea";
      const unitQuantity = itemByMaterialCode.quantities[detectedUnit] || 0;

      console.log(
        `🔍 Found by materialCode: ${materialCode}, unit: ${detectedUnit}, qty: ${unitQuantity}`
      );
      return unitQuantity;
    }

    // Fallback: หาด้วย barcode (วิธีเก่า)
    const itemByBarcode = findItemByBarcode(lastDetectedCode);
    const fallbackQuantity = itemByBarcode?.quantity || 0;

    console.log(
      `🔍 Fallback by barcode: ${lastDetectedCode}, qty: ${fallbackQuantity}`
    );
    return fallbackQuantity;
  }, [
    lastDetectedCode,
    product,
    detectedBarcodeType,
    findItemByMaterialCode,
    findItemByBarcode,
  ]);

  // ✅ FIXED: Enhanced handleAddToInventory to accept directProductGroup
  const handleAddToInventory = (
    product: Product,
    quantityInput: QuantityInput,
    barcodeType?: "ea" | "dsp" | "cs",
    directProductGroup?: string
  ): boolean => {
    const finalBarcodeType = barcodeType || detectedBarcodeType || "ea";

    console.log("🎯 handleAddToInventory called with Modern API:");
    console.log("  📦 Product:", product?.name);
    console.log("  🆔 Material Code:", product.id || product.barcode);
    console.log("  🔢 QuantityInput:", quantityInput);
    console.log("  🏷️ BarcodeType received:", barcodeType);
    console.log("  🏷️ DetectedBarcodeType:", detectedBarcodeType);
    console.log("  🏷️ Final BarcodeType:", finalBarcodeType);
    console.log("  🏭 DirectProductGroup:", directProductGroup);

    // ✅ ใช้ Modern Multi-Unit API เท่านั้น
    if (addOrUpdateMultiUnitItem) {
      try {
        console.log("🚀 Using Modern Multi-Unit API...");
        const success = addOrUpdateMultiUnitItem(
          product,
          quantityInput,
          finalBarcodeType,
          directProductGroup || product.category // ใช้ directProductGroup ถ้ามี
        );

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
          } else if (
            typeof quantityInput === "object" &&
            "quantity" in quantityInput
          ) {
            // New format: { quantity: number, unit: string }
            const unitMap = { ea: "ชิ้น", dsp: "แพ็ค", cs: "ลัง" };
            logMessage = `${quantityInput.quantity} ${
              unitMap[quantityInput.unit]
            }`;
          } else {
            // QuantityDetail format
            const quantityDetail = quantityInput as QuantityDetail;
            const unitMap = { ea: "ชิ้น", dsp: "แพ็ค", cs: "ลัง" };

            // สร้าง log message จาก quantities ที่มีค่า > 0
            const activeParts: string[] = [];
            if (quantityDetail.cs > 0)
              activeParts.push(`${quantityDetail.cs} ${unitMap.cs}`);
            if (quantityDetail.dsp > 0)
              activeParts.push(`${quantityDetail.dsp} ${unitMap.dsp}`);
            if (quantityDetail.ea > 0)
              activeParts.push(`${quantityDetail.ea} ${unitMap.ea}`);

            logMessage = activeParts.join(" + ") || "0 ชิ้น";
          }

          console.log(
            `✅ Added ${logMessage} of ${
              product?.name
            } (${finalBarcodeType.toUpperCase()}) using Modern API`
          );

          // ✅ Log current inventory summary
          console.log("📊 Current inventory summary:", {
            totalItems: summary.totalItems,
            totalCS: summary.quantityBreakdown?.totalCS || 0,
            totalDSP: summary.quantityBreakdown?.totalDSP || 0,
            totalEA: summary.quantityBreakdown?.totalEA || 0,
            itemsWithMultipleUnits:
              summary.quantityBreakdown?.itemsWithMultipleUnits || 0,
          });
        }

        return success;
      } catch (error) {
        console.error("❌ Modern Multi-Unit API error:", error);
        return false;
      }
    } else {
      console.error("❌ addOrUpdateMultiUnitItem function not available");
      return false;
    }
  };

  // ✅ New handler สำหรับเพิ่มสินค้าใหม่
  const handleAddNewProduct = (barcode: string) => {
    console.log("🆕 Add new product requested for barcode:", barcode);

    // เปิด form และเก็บ barcode
    setNewProductBarcode(barcode);
    setShowAddProductForm(true);
  };

  // ✅ Handler สำหรับบันทึกสินค้าใหม่ - รองรับครบ 3 หน่วย (CS, DSP, EA)
  const handleSaveNewProduct = async (productData: {
    barcode: string;
    productName: string;
    productGroup: string;
    description: string;
    countCs: number;
    countDsp: number;
    countPieces: number;
  }): Promise<boolean> => {
    try {
      console.log("🚀 === START SAVING NEW PRODUCT ===");
      console.log("📝 Input productData:", productData);

      // ✅ Validate product group
      if (!isValidProductGroup(productData.productGroup)) {
        console.error("❌ Invalid product group:", productData.productGroup);
        return false;
      }

      // ✅ สร้าง Product object
      const newProduct: Product = {
        id: `NEW_${Date.now()}`,
        barcode: productData.barcode,
        name: productData.productName,
        brand: "สินค้าใหม่",
        category: getProductCategoryFromGroup(productData.productGroup),
        description: productData.description,
        price: 0,
        status: ProductStatus.ACTIVE,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log("🏭 Created newProduct:", newProduct);

      // ✅ ใช้ Modern Multi-Unit API สำหรับบันทึกทุกหน่วย
      if (addOrUpdateMultiUnitItem) {
        console.log("🔥 Using Modern Multi-Unit API for all 3 units");

        // สร้าง QuantityDetail รวมทุกหน่วยใน object เดียว
        const allUnitsQuantity: QuantityDetail = {
          cs: productData.countCs || 0,
          dsp: productData.countDsp || 0,
          ea: productData.countPieces || 0,
        };

        console.log(
          "📦 Combined QuantityDetail for all units:",
          allUnitsQuantity
        );

        // เช็คว่ามีหน่วยไหนมีจำนวน > 0 บ้าง
        const hasAnyQuantity =
          allUnitsQuantity.cs > 0 ||
          allUnitsQuantity.dsp > 0 ||
          allUnitsQuantity.ea > 0;

        if (hasAnyQuantity) {
          try {
            console.log("💾 Saving all units in single call...");

            // เรียกใช้ครั้งเดียวด้วย QuantityDetail
            const success = addOrUpdateMultiUnitItem(
              newProduct,
              allUnitsQuantity, // ส่ง QuantityDetail ที่มีทุกหน่วย
              "ea", // barcodeType หลัก
              productData.productGroup
            );

            console.log(`📦 Multi-Unit API Result: ${success}`);

            if (success) {
              console.log("✅ Successfully saved all units in single item!");

              // Log แต่ละหน่วยที่บันทึก
              const savedUnits: string[] = [];
              if (allUnitsQuantity.cs > 0)
                savedUnits.push(`CS: ${allUnitsQuantity.cs} ลัง`);
              if (allUnitsQuantity.dsp > 0)
                savedUnits.push(`DSP: ${allUnitsQuantity.dsp} แพ็ค`);
              if (allUnitsQuantity.ea > 0)
                savedUnits.push(`EA: ${allUnitsQuantity.ea} ชิ้น`);

              console.log("📋 Saved units:", savedUnits.join(", "));

              // ปิด form
              setShowAddProductForm(false);
              setNewProductBarcode("");

              // ปิด product slide และเริ่มสแกนใหม่
              restartForNextScan();

              return true;
            } else {
              console.warn("⚠️ Multi-Unit API returned false");
              return false;
            }
          } catch (error) {
            console.error("❌ Multi-Unit API Error:", error);
            return false;
          }
        } else {
          console.log("⏭️ No quantities to save (all units are 0)");
          return false;
        }
      } else {
        console.error("❌ addOrUpdateMultiUnitItem function not available");
        return false;
      }
    } catch (error) {
      console.error("💥 ERROR in handleSaveNewProduct:", error);
      return false;
    }
  };

  // ✅ Handler สำหรับปิด form
  const handleCloseAddProductForm = () => {
    setShowAddProductForm(false);
    setNewProductBarcode("");
  };

  // ✅ Handler for updating quantity details with materialCode support
  const handleUpdateItemQuantityDetail = (
    materialCode: string,
    quantityDetail: QuantityDetail
  ): boolean => {
    console.log("🔧 Main page handleUpdateItemQuantityDetail:", {
      materialCode,
      quantityDetail,
      updateItemQuantityDetailExists: !!updateItemQuantityDetail,
    });

    // Call the actual inventory manager function with materialCode
    if (updateItemQuantityDetail) {
      try {
        const success = updateItemQuantityDetail(materialCode, quantityDetail);

        if (success) {
          console.log("✅ Quantity detail updated successfully");

          // Log current inventory summary after update
          console.log("📊 Updated inventory summary:", {
            totalItems: summary.totalItems,
            totalCS: summary.quantityBreakdown?.totalCS || 0,
            totalDSP: summary.quantityBreakdown?.totalDSP || 0,
            totalEA: summary.quantityBreakdown?.totalEA || 0,
            itemsWithMultipleUnits:
              summary.quantityBreakdown?.itemsWithMultipleUnits || 0,
          });
        } else {
          console.warn("⚠️ Quantity detail update returned false");
        }

        return success;
      } catch (error) {
        console.error("❌ Error in handleUpdateItemQuantityDetail:", error);
        return false;
      }
    }

    console.error("❌ updateItemQuantityDetail function not available");
    return false;
  };

  // ✅ FIXED: Modern legacy adapters for InventoryDisplay compatibility
  const handleLegacyAddOrUpdateItem = (
    product: Product,
    quantityInput: number,
    barcodeType?: "ea" | "dsp" | "cs",
    directProductGroup?: string
  ): boolean => {
    console.log("🔄 Legacy adapter: converting to modern API");

    // Convert legacy call to modern multi-unit API
    return handleAddToInventory(
      product,
      quantityInput,
      barcodeType,
      directProductGroup
    );
  };

  const handleLegacyUpdateItemQuantity = (
    itemId: string,
    newQuantity: number
  ): boolean => {
    console.log("🔄 Legacy adapter: updateItemQuantity", {
      itemId,
      newQuantity,
    });

    // Find item by ID and update using modern API
    const item = inventory.find((item) => item.id === itemId);
    if (!item) {
      console.error("❌ Item not found:", itemId);
      return false;
    }

    // Determine the primary unit to update
    const activeUnits = (["cs", "dsp", "ea"] as const).filter(
      (unit) => (item.quantities[unit] || 0) > 0
    );

    const primaryUnit = activeUnits.length > 0 ? activeUnits[0] : "ea";

    // Use modern updateUnitQuantity
    return updateUnitQuantity(item.materialCode, primaryUnit, newQuantity);
  };

  // ✅ Handle export with real export function
  const handleExportInventory = async (): Promise<void> => {
    if (!employee) {
      console.warn("⚠️ No employee data available for export");
      return;
    }

    console.log("📤 Starting REAL export process...");
    console.log(`👤 Employee: ${employee.employeeName}`);
    console.log(`🏢 Branch: ${employee.branchName} (${employee.branchCode})`);
    console.log(`📦 Inventory items: ${inventory.length}`);

    try {
      const success = await performRealExport();

      if (success) {
        // Generate filename with employee and branch info
        const now = new Date();
        const dateStr = now.toISOString().split("T")[0];
        const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "-");
        const fileName = `FNDTinventory_${employee.branchCode}_${dateStr}_${timeStr}.csv`;

        setExportFileName(fileName);
        setShowExportSuccess(true);

        console.log(
          `✅ ${employee.employeeName} exported inventory for ${employee.branchName}`
        );
        console.log(`📁 File generated: ${fileName}`);
      } else {
        console.error("❌ Export failed");
        if (exportError) {
          console.error("❌ Export error:", exportError);
        }
      }
    } catch (error) {
      console.error("❌ Export error:", error);
    }
  };

  // Clear all errors
  const clearAllErrors = () => {
    clearError();
    clearInventoryError();
    setExportError(null);
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

        {/* ✅ FIXED: Unified AppHeader without totalSKUs */}
        <AppHeader
          employeeName={employeeName}
          branchCode={branchCode}
          branchName={branchName}
          formatTimeRemaining={formatTimeRemaining}
          activeTab={activeTab}
          isStreaming={isStreaming}
          lastDetectedCode={lastDetectedCode}
          product={product}
          totalItems={summary.totalItems}
          onLogout={showLogoutConfirmation}
          onTabChange={setActiveTab}
          isMobile={isMobile}
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
            scannedBarcode={lastDetectedCode}
            // Product actions
            onAddToInventory={handleAddToInventory}
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

        {/* Add New Product Form */}
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

      {/* ✅ FIXED: Unified AppHeader without totalSKUs */}
      <AppHeader
        employeeName={employeeName}
        branchCode={branchCode}
        branchName={branchName}
        formatTimeRemaining={formatTimeRemaining}
        activeTab={activeTab}
        isStreaming={isStreaming}
        lastDetectedCode={lastDetectedCode}
        product={product}
        totalItems={summary.totalItems}
        onLogout={showLogoutConfirmation}
        onTabChange={setActiveTab}
        isMobile={isMobile}
      />

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
                scannedBarcode={lastDetectedCode}
                // Product actions
                onAddToInventory={handleAddToInventory}
                onAddNewProduct={handleAddNewProduct}
                restartForNextScan={restartForNextScan}
                currentInventoryQuantity={currentInventoryQuantity}
                // Layout options
                fullScreen={false}
                showHeader={true}
              />
            ) : (
              /* Desktop Layout - Side by Side */
              <div className="container mx-auto px-4 py-4 sm:py-6">
                {/* Error Display - Desktop Only */}
                {(errors || productError || inventoryError || exportError) && (
                  <div className="mb-4">
                    <ErrorDisplay
                      error={
                        errors ||
                        productError ||
                        inventoryError ||
                        exportError ||
                        ""
                      }
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
                      onAddToInventory={handleAddToInventory}
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
            {(inventoryError || exportError) && !isMobile && (
              <div className="mb-4">
                <ErrorDisplay
                  error={inventoryError || exportError || ""}
                  onDismiss={() => {
                    clearInventoryError();
                    setExportError(null);
                  }}
                  onRetry={() => {
                    clearInventoryError();
                    setExportError(null);
                  }}
                />
              </div>
            )}

            <div className="space-y-6">
              <InventoryDisplay
                inventory={inventory}
                summary={summary}
                isLoading={isLoadingInventory}
                error={inventoryError || exportError}
                // ✅ FIXED: ใช้ legacy adapters แทน direct legacy methods
                onAddOrUpdateItem={handleLegacyAddOrUpdateItem}
                onUpdateItemQuantity={handleLegacyUpdateItemQuantity}
                onUpdateItemQuantityDetail={handleUpdateItemQuantityDetail}
                onRemoveItem={removeItem}
                onClearInventory={clearInventory}
                onExport={handleExportInventory}
                onClearError={() => {
                  clearInventoryError();
                  setExportError(null);
                }}
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

      {/* Add New Product Form */}
      <AddNewProductForm
        isVisible={showAddProductForm}
        barcode={newProductBarcode}
        onClose={handleCloseAddProductForm}
        onSave={handleSaveNewProduct}
      />
    </div>
  );
}
