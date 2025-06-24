// ./src/components/layout/MobileProductSlide.tsx
"use client";

import React, { useEffect, useState } from "react";
import { X, ArrowDown, Plus } from "lucide-react";
import { Product } from "../../types/product";
import { ProductInfo } from "../ProductInfo";
import { QuantityInput } from "../../hooks/inventory/types"; // ✅ เพิ่ม import QuantityInput (number | QuantityDetail)

interface MobileProductSlideProps {
  isVisible: boolean;
  product: Product | null;
  detectedBarcodeType?: "ea" | "dsp" | "cs";
  currentInventoryQuantity: number;
  scannedBarcode?: string; // ✅ เพิ่ม: บาร์โค้ดที่ detect ได้
  productError?: string; // ✅ FIX: เปลี่ยนจาก string | null เป็น string | undefined
  onClose: () => void;
  onAddToInventory: (
    product: Product,
    quantityInput: QuantityInput, // ✅ FIX: เปลี่ยนจาก quantity: number เป็น quantityInput: QuantityInput เพื่อรองรับ Phase 2
    barcodeType?: "ea" | "dsp" | "cs"
  ) => boolean;
  onAddNewProduct?: (barcode: string) => void; // ✅ เพิ่ม: callback สำหรับเพิ่มสินค้าใหม่
  children?: React.ReactNode;
}

export const MobileProductSlide: React.FC<MobileProductSlideProps> = ({
  isVisible,
  product,
  detectedBarcodeType,
  currentInventoryQuantity,
  scannedBarcode = "", // ✅ รับ barcode ที่ scan
  productError, // ✅ FIX: รับ error message ที่เป็น string | undefined
  onClose,
  onAddToInventory,
  onAddNewProduct, // ✅ รับ callback สำหรับเพิ่มสินค้าใหม่
  children,
}) => {
  const [, setIsAnimating] = useState(false);

  // Handle slide animation
  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      // Add slight delay for smoother animation
      const timer = setTimeout(() => setIsAnimating(false), 400);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isVisible]);

  // ✅ Dynamic header title based on product status
  const getHeaderTitle = () => {
    if (product) {
      return "ข้อมูลสินค้า";
    } else if (productError) {
      return "ไม่พบสินค้า";
    } else {
      return "ผลการสแกน";
    }
  };

  // ✅ Dynamic close button text
  const getCloseButtonText = () => {
    if (product) {
      return "สแกนต่อ";
    } else {
      return "สแกนใหม่";
    }
  };

  // ✅ Handler สำหรับเพิ่มสินค้าใหม่
  const handleAddNewProduct = () => {
    if (onAddNewProduct && scannedBarcode) {
      onAddNewProduct(scannedBarcode);
    }
  };

  // ✅ ตรวจสอบว่าควรแสดงปุ่ม "เพิ่มสินค้าใหม่" หรือไม่
  const shouldShowAddNewProductButton = () => {
    return !product && productError && scannedBarcode && onAddNewProduct;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 transition-opacity duration-300 z-40 ${
          isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Slide Up Panel */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl transition-transform duration-400 ease-out ${
          isVisible ? "translate-y-0" : "translate-y-full"
        }`}
        style={{
          height: "75vh",
          willChange: "transform",
        }}
      >
        {/* Handle Bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* ✅ Dynamic Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {getHeaderTitle()}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* ✅ Content - Use ProductInfo Component with enhanced error handling */}
        <div className="flex-1 overflow-y-auto">
          <ProductInfo
            product={product}
            barcode={scannedBarcode} // ✅ ส่งบาร์โค้ดที่ scan
            barcodeType={detectedBarcodeType}
            isLoading={false}
            error={productError} // ✅ FIX: ตอนนี้ type ตรงกันแล้ว (string | undefined)
            onAddToInventory={onAddToInventory} // ✅ FIX: ตอนนี้ signature ตรงกันแล้ว (QuantityInput)
            currentInventoryQuantity={currentInventoryQuantity}
          />

          {/* Custom Content */}
          {children}
        </div>

        {/* ✅ Action Buttons - Dynamic based on product status */}
        <div className="px-4 py-4 border-t border-gray-100 bg-white">
          {product ? (
            /* ✅ เจอสินค้า - แสดงปุ่มเดียว */
            <button
              onClick={onClose}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <ArrowDown size={16} />
              สแกนต่อ
            </button>
          ) : (
            /* ✅ ไม่เจอสินค้า - แสดง 2 ปุ่ม */
            <div className="space-y-3">
              {shouldShowAddNewProductButton() && (
                <button
                  onClick={handleAddNewProduct}
                  className="w-full bg-fn-green hover:bg-fn-green/90 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  เพิ่มสินค้าใหม่
                </button>
              )}

              <button
                onClick={onClose}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <ArrowDown size={16} />
                {getCloseButtonText()}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
