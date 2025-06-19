// src/components/product/EnhancedProductNotFoundState.tsx
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
      <div className="fn-product-not-found">
        <div className="text-center">
          {/* Error Icon */}
          <div className="error-icon">
            <AlertTriangle size={40} />
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            ไม่พบข้อมูลสินค้า
          </h3>

          {/* Error Message */}
          <p className="text-gray-600 text-sm mb-4">{error}</p>

          {/* Barcode Display */}
          <div className="fn-barcode-display">
            <p className="text-xs text-gray-500 mb-1">Barcode ที่สแกน:</p>
            <div className="flex items-center justify-between">
              <code className="flex-1 text-left">{barcode}</code>
              <button
                onClick={handleCopyBarcode}
                className={`fn-copy-btn ml-2 ${copied ? "copied" : ""}`}
                title="คัดลอกบาร์โค้ด"
              >
                {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
              </button>
            </div>
            {copied && (
              <p className="text-xs text-fn-green mt-1">คัดลอกแล้ว!</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Primary Action: Add Product */}
            <button
              onClick={() => setIsAddProductModalOpen(true)}
              className="fn-add-product-btn w-full"
            >
              <Plus size={18} />
              เพิ่มสินค้าใหม่
            </button>

            {/* Secondary Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleRescan} className="fn-secondary-btn">
                <RefreshCw size={16} />
                สแกนใหม่
              </button>

              <button onClick={handleManualSearch} className="fn-secondary-btn">
                <Search size={16} />
                ค้นหาด้วยตนเอง
              </button>
            </div>
          </div>

          {/* Help Text */}
          <div className="fn-help-text mt-4">
            <p>
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

export default EnhancedProductNotFoundState;
