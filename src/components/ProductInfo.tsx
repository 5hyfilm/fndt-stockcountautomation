// Path: src/components/ProductInfo.tsx
// Fix: แก้ไข type compatibility สำหรับ detectedBarcodeType

"use client";

import React, { useState } from "react";
import { Product, BarcodeType } from "../types/product";
import { ProductWithMultipleBarcodes } from "../data/types/csvTypes";

// Import sub-components
import { ProductHeader } from "./product/ProductHeader";
import { ProductBasicInfo } from "./product/ProductBasicInfo";
import { InventoryAddSection } from "./product/InventoryAddSection";
import { ProductDescription } from "./product/ProductDescription";
import { BarcodeInfo } from "./product/BarcodeInfo";
import { ProductDetails } from "./product/ProductDetails";
import { NutritionInfo } from "./product/NutritionInfo";
import {
  LoadingState,
  ErrorState,
  WaitingScanState,
  ProductNotFoundState,
} from "./product/EmptyStates";

interface ProductInfoProps {
  product: Product | ProductWithMultipleBarcodes | null;
  barcode?: string;
  // ✅ FIX: รองรับทั้ง string และ BarcodeType enum
  detectedBarcodeType?: BarcodeType | "ea" | "dsp" | "cs" | null;
  isLoading?: boolean;
  error?: string;
  onAddToInventory?: (
    product: Product,
    quantity: number,
    barcodeType: BarcodeType
  ) => boolean;
  currentInventoryQuantity?: number;

  // Additional props for enhanced functionality
  scannedBarcode?: string;
  fullScreen?: boolean;
  showHeader?: boolean;
}

// ✅ NEW: Helper function to convert string to BarcodeType
const convertToBarcodeType = (
  type: BarcodeType | "ea" | "dsp" | "cs" | null | undefined
): BarcodeType | null => {
  if (!type) return null;

  // ถ้าเป็น string ให้แปลงเป็น enum
  if (typeof type === "string") {
    switch (type) {
      case "ea":
        return BarcodeType.EA;
      case "dsp":
        return BarcodeType.DSP;
      case "cs":
        return BarcodeType.CS;
      default:
        return null;
    }
  }

  // ถ้าเป็น enum อยู่แล้วให้ return ตรงๆ
  return type;
};

export const ProductInfo: React.FC<ProductInfoProps> = ({
  product,
  barcode,
  detectedBarcodeType,
  isLoading,
  error,
  onAddToInventory,
  currentInventoryQuantity = 0,
  scannedBarcode,
  fullScreen = false,
  showHeader = true,
}) => {
  const [copied, setCopied] = useState(false);

  // ✅ FIX: แปลง detectedBarcodeType ให้เป็น BarcodeType enum
  const normalizedBarcodeType = convertToBarcodeType(detectedBarcodeType);

  // Enhanced barcode copy function
  const copyBarcode = async () => {
    const codeToCopy = scannedBarcode || barcode || product?.barcode;
    if (!codeToCopy) return;

    try {
      await navigator.clipboard.writeText(codeToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy barcode:", err);
    }
  };

  // ✅ FIX: ใช้ normalizedBarcodeType แทน detectedBarcodeType
  const shouldShowInventorySection =
    product && !error && onAddToInventory && normalizedBarcodeType;

  // Enhanced logging for debugging
  if (process.env.NODE_ENV === "development") {
    console.log("🔍 ProductInfo Debug:", {
      hasProduct: !!product,
      hasError: !!error,
      hasOnAddToInventory: !!onAddToInventory,
      originalBarcodeType: detectedBarcodeType,
      normalizedBarcodeType: normalizedBarcodeType,
      shouldShowInventorySection,
    });
  }

  // Show empty states
  if (isLoading) {
    return <LoadingState message="กำลังค้นหาข้อมูลสินค้า..." />;
  }

  if (error && !product) {
    return (
      <ErrorState
        error={error}
        barcode={scannedBarcode || barcode}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!product && !error && !isLoading) {
    return <WaitingScanState />;
  }

  // Handle product not found with scanned barcode
  if (!product && scannedBarcode) {
    return (
      <ProductNotFoundState
        barcode={scannedBarcode}
        onAddNewProduct={() => {
          // Handle add new product logic
          console.log("Add new product for barcode:", scannedBarcode);
        }}
      />
    );
  }

  return (
    <div
      className={`
        bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden
        ${fullScreen ? "h-full" : ""}
      `}
    >
      {/* Header */}
      {showHeader && (
        <ProductHeader
          product={product}
          detectedBarcodeType={normalizedBarcodeType} // ✅ ใช้ normalized type
        />
      )}

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Basic Info */}
        <ProductBasicInfo
          product={product}
          detectedBarcodeType={normalizedBarcodeType} // ✅ ใช้ normalized type
          scannedBarcode={scannedBarcode}
          onCopyBarcode={copyBarcode}
          copied={copied}
        />

        {/* ✅ FIX: Inventory Add Section - ใช้ normalizedBarcodeType */}
        {shouldShowInventorySection && (
          <InventoryAddSection
            product={product}
            detectedBarcodeType={normalizedBarcodeType} // ✅ ใช้ normalized type (รับประกันว่าเป็น BarcodeType | null)
            onAddToInventory={onAddToInventory}
            isVisible={true}
            currentInventoryQuantity={currentInventoryQuantity}
          />
        )}

        {/* Description */}
        <ProductDescription product={product} />

        {/* Barcode Information */}
        <BarcodeInfo
          product={product}
          scannedBarcode={scannedBarcode || barcode}
          detectedBarcodeType={normalizedBarcodeType} // ✅ ใช้ normalized type
        />

        {/* Product Details */}
        <ProductDetails product={product} />

        {/* Nutrition Information */}
        <NutritionInfo product={product} />
      </div>
    </div>
  );
};
