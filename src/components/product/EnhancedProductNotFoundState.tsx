// ./src/components/product/EnhancedProductNotFoundState.tsx
"use client";

import React, { useState } from "react";
import {
  Package,
  Copy,
  CheckCircle,
  Plus,
  Search,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

// Import AddProductModal
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

// ✅ เพิ่ม export เพื่อแก้ปัญหา "is not a module"
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

  // Handle copy barcode
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

  // Handle add product success
  const handleProductAdded = (product: any) => {
    setIsAddProductModalOpen(false);
    onProductAdded?.(product);
  };

  // Handle rescan
  const handleRescan = () => {
    if (onRescan) {
      onRescan();
    } else {
      window.location.reload();
    }
  };

  // Handle manual search
  const handleManualSearch = () => {
    if (onManualSearch) {
      onManualSearch();
    } else {
      console.log("Manual search for:", barcode);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 max-w-md mx-auto">
        <div className="text-center">
          {/* Icon */}
          <div className="bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="text-red-500" size={40} />
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            ไม่พบข้อมูลสินค้า
          </h3>

          {/* Error Message */}
          <p className="text-gray-600 text-sm mb-4">{error}</p>

          {/* Barcode Display */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 border">
            <p className="text-xs text-gray-500 mb-1">Barcode ที่สแกน:</p>
            <div className="flex items-center justify-between">
              <code className="text-sm font-mono text-gray-800 flex-1">
                {barcode}
              </code>
              <button
                onClick={handleCopyBarcode}
                className="ml-2 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                title="คัดลอกบาร์โค้ด"
              >
                {copied ? (
                  <CheckCircle size={16} className="text-green-500" />
                ) : (
                  <Copy size={16} />
                )}
              </button>
            </div>
            {copied && (
              <p className="text-xs text-green-600 mt-1">คัดลอกแล้ว!</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Primary Action: Add Product */}
            <button
              onClick={() => setIsAddProductModalOpen(true)}
              className="w-full bg-fn-green hover:bg-fn-green/90 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              เพิ่มสินค้าใหม่
            </button>

            {/* Secondary Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleRescan}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 text-sm"
              >
                <RefreshCw size={16} />
                สแกนใหม่
              </button>

              <button
                onClick={handleManualSearch}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 text-sm"
              >
                <Search size={16} />
                ค้นหาด้วยตนเอง
              </button>
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-700">
              💡 <strong>เคล็ดลับ:</strong> ตรวจสอบว่าบาร์โค้ดถูกต้องและชัดเจน
              หรือลองสแกนในแสงที่เพียงพอ
            </p>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={isAddProductModalOpen}
        onClose={() => setIsAddProductModalOpen(false)}
        barcode={barcode}
        onSuccess={handleProductAdded}
      />
    </>
  );
};

// ✅ เพิ่ม default export
export default EnhancedProductNotFoundState;

// Hook สำหรับใช้ร่วมกับ ProductInfo component
export const useEnhancedProductNotFound = (
  barcode: string,
  onProductAdded?: (product: any) => void
) => {
  const [copied, setCopied] = useState(false);

  const handleCopyBarcode = async () => {
    try {
      await navigator.clipboard.writeText(barcode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleRescan = () => {
    window.location.reload();
  };

  const handleManualSearch = () => {
    // Navigate to search page or open search modal
    console.log("Manual search for:", barcode);
  };

  return {
    copied,
    handleCopyBarcode,
    handleRescan,
    handleManualSearch,
    onProductAdded,
  };
};
