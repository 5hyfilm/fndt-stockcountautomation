// src/components/product/ProductNotFoundState.tsx
"use client";

import React, { useState } from "react";
import { Package, Copy, CheckCircle, Plus } from "lucide-react";
import ManualProductManager from "../manual-product/ManualProductManager";

// ===== INTERFACES =====
interface ProductNotFoundStateProps {
  barcode: string;
  onCopyBarcode: () => void;
  copied: boolean;
  onProductAdded?: (product: any) => void;
  employeeContext?: {
    employeeName: string;
    branchCode: string;
    branchName: string;
  };
}

// ===== MAIN COMPONENT =====
export const ProductNotFoundState: React.FC<ProductNotFoundStateProps> = ({
  barcode,
  onCopyBarcode,
  copied,
  onProductAdded,
  employeeContext,
}) => {
  const [showManualProductManager, setShowManualProductManager] =
    useState(false);

  const handleAddNewProduct = () => {
    console.log("🚀 Opening manual product addition for barcode:", barcode);
    setShowManualProductManager(true);
  };

  const handleProductAdded = (newProduct: any) => {
    console.log("✅ New product added:", newProduct);
    setShowManualProductManager(false);
    onProductAdded?.(newProduct);
  };

  const handleCloseManualProduct = () => {
    console.log("❌ Manual product addition cancelled");
    setShowManualProductManager(false);
  };

  return (
    <>
      <div className="bg-white rounded-xl p-4 lg:p-6 shadow-lg border border-gray-200">
        <div className="text-center py-8">
          <div className="bg-yellow-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
            <Package className="text-yellow-600" size={32} />
          </div>
          <p className="text-yellow-600 font-medium mb-2">ไม่พบข้อมูลสินค้า</p>
          <p className="text-gray-600 text-sm mb-4">
            สินค้านี้ยังไม่มีในฐานข้อมูล
          </p>

          {/* Barcode Display */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Barcode:</p>
                <code className="text-sm font-mono text-gray-800">
                  {barcode}
                </code>
              </div>
              <button
                onClick={onCopyBarcode}
                className="text-gray-500 hover:text-gray-700 p-1 transition-colors"
                title={copied ? "คัดลอกแล้ว" : "คัดลอกบาร์โค้ด"}
              >
                {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            <button
              onClick={handleAddNewProduct}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>เพิ่มสินค้าใหม่</span>
            </button>

            <p className="text-xs text-gray-500 mt-2">
              คลิกเพื่อเพิ่มข้อมูลสินค้านี้เข้าสู่ระบบ
            </p>
          </div>
        </div>
      </div>

      {/* Manual Product Manager */}
      {showManualProductManager && (
        <ManualProductManager
          scannedBarcode={barcode}
          onProductAdded={handleProductAdded}
          onCancel={handleCloseManualProduct}
          employeeContext={employeeContext}
          showInitialDialog={true}
          enablePreview={true}
          autoValidation={true}
        />
      )}
    </>
  );
};

export default ProductNotFoundState;
