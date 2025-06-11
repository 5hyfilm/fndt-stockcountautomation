// src/components/sections/ProductInfoSection.tsx
"use client";

import React from "react";
import { Package } from "lucide-react";
import { ProductInfo } from "../ProductInfo";

interface ProductInfoSectionProps {
  product?: any;
  barcode?: string;
  barcodeType?: "ea" | "dsp" | "cs";
  isLoading: boolean;
  error?: string;
  currentInventoryQuantity: number;
  isMobile: boolean;
  onAddToInventory: (
    product: any,
    quantity: number,
    barcodeType?: "ea" | "dsp" | "cs"
  ) => boolean;
}

export const ProductInfoSection: React.FC<ProductInfoSectionProps> = ({
  product,
  barcode,
  barcodeType,
  isLoading,
  error,
  currentInventoryQuantity,
  isMobile,
  onAddToInventory,
}) => {
  return (
    <div>
      <div className={`${isMobile ? "mb-2" : "mb-3"} flex items-center gap-2`}>
        <Package className="fn-green" size={isMobile ? 16 : 20} />
        <h3
          className={`${
            isMobile ? "text-base" : "text-lg"
          } font-semibold text-gray-900`}
        >
          ข้อมูลสินค้า
        </h3>
        {isLoading && (
          <div className="animate-spin w-4 h-4 border-2 border-fn-green border-t-transparent rounded-full"></div>
        )}
      </div>

      <ProductInfo
        product={product}
        barcode={barcode}
        barcodeType={barcodeType}
        isLoading={isLoading}
        error={error}
        onAddToInventory={onAddToInventory}
        currentInventoryQuantity={currentInventoryQuantity}
      />
    </div>
  );
};
