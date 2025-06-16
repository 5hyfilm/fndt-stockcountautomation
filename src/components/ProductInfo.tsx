// src/components/ProductInfo.tsx - Enhanced with Manual Product Addition
"use client";

import React, { useState } from "react";
import { Product } from "../types/product";

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
} from "./product/EmptyStates";

// Import enhanced ProductNotFoundState
import ProductNotFoundState from "./product/ProductNotFoundState";

// ===== INTERFACES =====
interface ProductInfoProps {
  product: Product | null;
  barcode?: string;
  barcodeType?: "ea" | "dsp" | "cs";
  isLoading?: boolean;
  error?: string;
  onAddToInventory?: (
    product: Product,
    quantity: number,
    barcodeType?: "ea" | "dsp" | "cs"
  ) => boolean;
  onProductAdded?: (product: any) => void; // Callback เมื่อเพิ่มสินค้าใหม่สำเร็จ
  currentInventoryQuantity?: number;
  employeeContext?: {
    employeeName: string;
    branchCode: string;
    branchName: string;
  };
}

// ===== MAIN COMPONENT =====
export const ProductInfo: React.FC<ProductInfoProps> = ({
  product,
  barcode,
  barcodeType,
  isLoading,
  error,
  onAddToInventory,
  onProductAdded,
  currentInventoryQuantity = 0,
  employeeContext,
}) => {
  const [copied, setCopied] = useState(false);

  const copyBarcode = async () => {
    const codeToCopy = barcode || product?.barcode;
    if (!codeToCopy) return;

    try {
      await navigator.clipboard.writeText(codeToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy barcode:", err);
    }
  };

  // Handle new product added
  const handleProductAdded = (newProduct: any) => {
    console.log("🎉 New product added via manual entry:", newProduct);
    onProductAdded?.(newProduct);
  };

  // Determine if inventory add section should be visible
  const shouldShowInventorySection = product && !error && onAddToInventory;

  // Handle different states
  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} barcode={barcode} />;
  }

  if (!product && !barcode) {
    return <WaitingScanState />;
  }

  // Product not found - show enhanced version with manual addition
  if (!product && barcode) {
    return (
      <ProductNotFoundState
        barcode={barcode}
        onCopyBarcode={copyBarcode}
        copied={copied}
        onProductAdded={handleProductAdded}
        employeeContext={employeeContext}
      />
    );
  }

  // Main product display
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Product Header */}
      <ProductHeader product={product!} />

      {/* Content */}
      <div className="p-4 lg:p-6 space-y-4">
        {/* Basic Product Information */}
        <ProductBasicInfo
          product={product!}
          currentInventoryQuantity={currentInventoryQuantity}
        />

        {/* Inventory Add Section */}
        {shouldShowInventorySection && (
          <InventoryAddSection
            product={product!}
            currentInventoryQuantity={currentInventoryQuantity}
            onAddToInventory={onAddToInventory!}
            barcodeType={barcodeType}
          />
        )}

        {/* Product Description */}
        <ProductDescription product={product!} />

        {/* Barcode Information */}
        <BarcodeInfo
          product={product!}
          scannedBarcode={barcode}
          detectedBarcodeType={barcodeType}
        />

        {/* Product Details */}
        <ProductDetails product={product!} />

        {/* Nutrition Information */}
        <NutritionInfo product={product!} />
      </div>
    </div>
  );
};

export default ProductInfo;
