// src/components/layout/MobileScannerLayout.tsx - Enhanced with Manual Product Addition
"use client";

import React, { useState, useEffect } from "react";
import BarcodeScanner from "../scanner/BarcodeScanner";
import ProductInfo from "../ProductInfo"; // ใช้ enhanced version
import { MobileProductSlide } from "./MobileProductSlide";
import { useProductLookup } from "../../hooks/product/useProductLookup"; // enhanced version
import { Product } from "../../types/product";

// ===== INTERFACES =====
interface MobileScannerLayoutProps {
  onAddToInventory: (
    product: Product,
    quantity: number,
    barcodeType?: "ea" | "dsp" | "cs"
  ) => boolean;
  currentInventoryQuantity?: number;
  employeeContext?: {
    employeeName: string;
    branchCode: string;
    branchName: string;
  };
}

// ===== MAIN COMPONENT =====
export const MobileScannerLayout: React.FC<MobileScannerLayoutProps> = ({
  onAddToInventory,
  currentInventoryQuantity = 0,
  employeeContext = {
    employeeName: "Demo User",
    branchCode: "DEMO",
    branchName: "Demo Branch",
  },
}) => {
  // Scanner state
  const [isStreaming, setIsStreaming] = useState(false);
  const [showProductSlide, setShowProductSlide] = useState(false);

  // Product lookup with manual addition support
  const {
    product,
    detectedBarcodeType,
    isLoadingProduct,
    productError,
    lastDetectedCode,
    updateBarcode,
    clearProduct,
    clearCurrentDetection,
    handleProductAdded, // สำหรับ manual product addition
  } = useProductLookup({
    onProductFound: () => {
      console.log("📱 Product found, showing slide panel");
      setShowProductSlide(true);
      setIsStreaming(false); // หยุดกล้องเมื่อเจอสินค้า
    },
    onProductAdded: (newProduct) => {
      console.log("🎉 New product added via manual entry:", newProduct);
      setShowProductSlide(true);
      setIsStreaming(false); // หยุดกล้องเมื่อเพิ่มสินค้าใหม่สำเร็จ
    },
  });

  // Handle barcode detection from scanner
  const handleBarcodeDetected = (barcode: string) => {
    console.log("📱 Barcode detected:", barcode);
    updateBarcode(barcode);
  };

  // Handle starting camera
  const handleStartCamera = () => {
    console.log("📷 Starting camera");
    setIsStreaming(true);
    clearCurrentDetection();
    setShowProductSlide(false);
  };

  // Handle stopping camera
  const handleStopCamera = () => {
    console.log("📷 Stopping camera");
    setIsStreaming(false);
  };

  // Handle closing product slide
  const handleCloseProductSlide = () => {
    console.log("📱 Closing product slide");
    setShowProductSlide(false);
    clearProduct();
  };

  // Handle adding to inventory
  const handleAddToInventory = (
    product: Product,
    quantity: number,
    barcodeType?: "ea" | "dsp" | "cs"
  ) => {
    const success = onAddToInventory(product, quantity, barcodeType);
    if (success) {
      console.log("✅ Added to inventory:", product.name, quantity);
      // Could show success toast here
    }
    return success;
  };

  // Auto-start camera on mount
  useEffect(() => {
    handleStartCamera();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 relative">
      {/* Camera Scanner */}
      <div className="relative w-full h-screen">
        <BarcodeScanner
          onBarcodeDetected={handleBarcodeDetected}
          isStreaming={isStreaming}
          onStreamStart={() => setIsStreaming(true)}
          onStreamStop={() => setIsStreaming(false)}
        />

        {/* Camera Controls */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30">
          <div className="flex space-x-4">
            {isStreaming ? (
              <button
                onClick={handleStopCamera}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full font-medium transition-colors"
              >
                หยุดกล้อง
              </button>
            ) : (
              <button
                onClick={handleStartCamera}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-medium transition-colors"
              >
                เริ่มสแกน
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoadingProduct && (
        <div className="absolute top-4 left-4 right-4 z-40">
          <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <span className="text-blue-900 font-medium">
                กำลังค้นหาสินค้า...
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {productError && !showProductSlide && (
        <div className="absolute top-4 left-4 right-4 z-40">
          <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4">
            <div className="text-yellow-800 text-sm font-medium">
              {productError}
            </div>
          </div>
        </div>
      )}

      {/* Success Detection Feedback */}
      {lastDetectedCode && !productError && !showProductSlide && (
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
        onAddToInventory={handleAddToInventory}
      />

      {/* Product Info with Manual Addition Support */}
      {!showProductSlide && (
        <div className="absolute bottom-20 left-4 right-4 z-30">
          <ProductInfo
            product={product}
            barcode={lastDetectedCode}
            barcodeType={detectedBarcodeType || undefined}
            isLoading={isLoadingProduct}
            error={productError}
            onAddToInventory={handleAddToInventory}
            onProductAdded={handleProductAdded} // เพิ่มสำหรับ manual addition
            currentInventoryQuantity={currentInventoryQuantity}
            employeeContext={employeeContext} // ส่ง employee context
          />
        </div>
      )}
    </div>
  );
};

export default MobileScannerLayout;
