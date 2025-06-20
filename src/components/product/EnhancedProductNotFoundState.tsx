// src/components/product/EnhancedProductNotFoundState.tsx
"use client";

import React, { useState } from "react";
import {
  Copy,
  CheckCircle,
  Plus,
  Search,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

// Import AddProductModal - ✅ Fixed import path
import { AddProductModal } from "../modals/AddProductModal";

interface EnhancedProductNotFoundStateProps {
  barcode: string;
  onCopyBarcode?: () => void;
  copied?: boolean;
  onRescan?: () => void;
  onManualSearch?: () => void;
  error?: string;
  onProductAdded?: (product: any) => void;
}

export const EnhancedProductNotFoundState: React.FC<
  EnhancedProductNotFoundStateProps
> = ({
  barcode,
  onCopyBarcode,
  copied: externalCopied,
  onRescan,
  onManualSearch,
  error = "ไม่พบข้อมูลสินค้าในระบบ",
  onProductAdded,
}) => {
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [internalCopied, setInternalCopied] = useState(false);

  // Use external copied state if provided, otherwise use internal state
  const copied = externalCopied !== undefined ? externalCopied : internalCopied;

  // ✅ Handle copy barcode - Fixed complete function
  const handleCopyBarcode = async () => {
    if (onCopyBarcode) {
      onCopyBarcode();
    } else {
      try {
        await navigator.clipboard.writeText(barcode);
        setInternalCopied(true);
        setTimeout(() => setInternalCopied(false), 2000);
      } catch (error) {
        console.error("Failed to copy:", error);
      }
    }
  };

  // ✅ Handle add product success - Fixed complete function
  const handleProductAdded = (product: any) => {
    setIsAddProductModalOpen(false);
    onProductAdded?.(product);
  };

  // ✅ Handle rescan - Added complete function
  const handleRescan = () => {
    if (onRescan) {
      onRescan();
    } else {
      // Fallback: reload page
      window.location.reload();
    }
  };

  // ✅ Handle manual search - Added complete function
  const handleManualSearch = () => {
    if (onManualSearch) {
      onManualSearch();
    } else {
      // Fallback: log for debugging
      console.log("Manual search for:", barcode);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="text-center space-y-6">
          {/* Error Icon */}
          <div className="flex justify-center">
            <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center">
              <AlertTriangle className="text-orange-500" size={32} />
            </div>
          </div>

          {/* Title & Error Message */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-800">
              ไม่พบข้อมูลสินค้า
            </h3>
            <p className="text-gray-600 text-sm">{error}</p>
          </div>

          {/* Barcode Display */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <p className="text-xs text-gray-500">Barcode ที่สแกน:</p>
            <div className="flex items-center justify-between bg-white rounded-lg p-3 border">
              <code className="flex-1 text-sm font-mono text-gray-800 text-left">
                {barcode}
              </code>
              <button
                onClick={handleCopyBarcode}
                className={`ml-3 p-2 rounded-lg transition-all duration-200 ${
                  copied
                    ? "bg-green-100 text-green-600"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                }`}
                title="คัดลอกบาร์โค้ด"
              >
                {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
              </button>
            </div>
            {copied && (
              <p className="text-xs text-green-600 font-medium">
                ✓ คัดลอกแล้ว!
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Primary Action: Add Product */}
            <button
              onClick={() => setIsAddProductModalOpen(true)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 shadow-sm"
            >
              <Plus size={18} />
              เพิ่มสินค้าใหม่
            </button>

            {/* Secondary Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleRescan}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} />
                สแกนใหม่
              </button>

              <button
                onClick={handleManualSearch}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <Search size={16} />
                ค้นหาด้วยตนเอง
              </button>
            </div>
          </div>

          {/* Help Text */}
          <div className="bg-blue-50 rounded-lg p-4 text-left">
            <div className="flex items-start gap-3">
              <div className="text-blue-500 text-lg">💡</div>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">เคล็ดลับ:</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• ตรวจสอบว่าบาร์โค้ดถูกต้องและชัดเจน</li>
                  <li>• ลองสแกนในแสงที่เพียงพอ</li>
                  <li>• หากแน่ใจว่าเป็นสินค้าใหม่ กดปุ่ม "เพิ่มสินค้าใหม่"</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Add Product Modal - Fixed complete implementation */}
      {isAddProductModalOpen && (
        <AddProductModal
          isOpen={isAddProductModalOpen}
          onClose={() => setIsAddProductModalOpen(false)}
          barcode={barcode}
          onSuccess={handleProductAdded}
        />
      )}
    </>
  );
};

export default EnhancedProductNotFoundState;
