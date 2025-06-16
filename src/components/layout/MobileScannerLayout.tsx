// src/components/layout/MobileScannerLayout.tsx
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
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full font-medium transition-colors shadow-lg"
              >
                หยุดสแกน
              </button>
            ) : (
              <button
                onClick={handleStartCamera}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full font-medium transition-colors shadow-lg"
              >
                เริ่มสแกน
              </button>
            )}
          </div>
        </div>

        {/* Loading Overlay */}
        {isLoadingProduct && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-20">
            <div className="bg-white rounded-lg p-4 flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="text-gray-700 font-medium">
                กำลังค้นหาสินค้า...
              </span>
            </div>
          </div>
        )}

        {/* Product Error */}
        {productError && !isLoadingProduct && (
          <div className="absolute top-4 left-4 right-4 bg-red-500/90 backdrop-blur-sm text-white p-3 rounded-lg z-20">
            <p className="text-sm">{productError}</p>
          </div>
        )}

        {/* Barcode Display */}
        {lastDetectedCode && !product && !isLoadingProduct && (
          <div className="absolute top-4 left-4 right-4 bg-blue-500/90 backdrop-blur-sm text-white p-3 rounded-lg z-20">
            <p className="text-sm">
              Barcode: <span className="font-mono">{lastDetectedCode}</span>
            </p>
          </div>
        )}
      </div>

      {/* Product Slide Panel */}
      {showProductSlide && product && (
        <MobileProductSlide
          product={product}
          detectedBarcodeType={detectedBarcodeType || "ea"}
          currentInventoryQuantity={currentInventoryQuantity}
          onAddToInventory={handleAddToInventory}
          onClose={handleCloseProductSlide}
          onContinueScanning={() => {
            handleCloseProductSlide();
            handleStartCamera();
          }}
          employeeContext={employeeContext}
        />
      )}

      {/* Manual Product Addition for Not Found */}
      {showProductSlide &&
        !product &&
        lastDetectedCode &&
        !isLoadingProduct && (
          <div className="absolute inset-0 bg-black/50 flex items-end z-40">
            <div className="bg-white w-full rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto">
              <div className="text-center py-8">
                <div className="bg-yellow-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-8 h-8 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  ไม่พบสินค้าในระบบ
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Barcode: <span className="font-mono">{lastDetectedCode}</span>
                </p>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      // Handle manual product addition
                      if (handleProductAdded && lastDetectedCode) {
                        // This would open manual product addition flow
                        console.log(
                          "Opening manual product addition for:",
                          lastDetectedCode
                        );
                      }
                    }}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                  >
                    เพิ่มสินค้าใหม่
                  </button>

                  <button
                    onClick={() => {
                      handleCloseProductSlide();
                      handleStartCamera();
                    }}
                    className="w-full bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                  >
                    สแกนใหม่
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};
