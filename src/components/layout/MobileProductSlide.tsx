// src/components/layout/MobileProductSlide.tsx
"use client";

import React, { useEffect, useState } from "react";
import { X, ArrowDown } from "lucide-react";
import { ProductInfo } from "../ProductInfo";

interface MobileProductSlideProps {
  isVisible: boolean;
  product: any;
  detectedBarcodeType?: "ea" | "dsp" | "cs";
  currentInventoryQuantity: number;
  onClose: () => void;
  onAddToInventory: (
    product: any,
    quantity: number,
    barcodeType?: "ea" | "dsp" | "cs"
  ) => boolean;
  children?: React.ReactNode;
}

export const MobileProductSlide: React.FC<MobileProductSlideProps> = ({
  isVisible,
  product,
  detectedBarcodeType,
  currentInventoryQuantity,
  onClose,
  onAddToInventory,
  children,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

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

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">ข้อมูลสินค้า</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content - Use ProductInfo Component */}
        <div className="flex-1 overflow-y-auto">
          <ProductInfo
            product={product}
            barcodeType={detectedBarcodeType}
            isLoading={false}
            error={undefined}
            onAddToInventory={onAddToInventory}
            currentInventoryQuantity={currentInventoryQuantity}
          />

          {/* Custom Content */}
          {children}
        </div>

        {/* Action Buttons - Only "สแกนต่อ" */}
        <div className="px-4 py-4 border-t border-gray-100 bg-white">
          <button
            onClick={onClose}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <ArrowDown size={16} />
            สแกนต่อ
          </button>
        </div>
      </div>
    </>
  );
};
