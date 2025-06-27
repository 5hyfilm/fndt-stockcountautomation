// Path: src/components/ProductInfo.tsx
// Updated for Phase 3: Separate unit storage with simplified quantity input

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
  detectedBarcodeType?: BarcodeType | null; // ✅ UPDATED: Use BarcodeType enum
  isLoading?: boolean;
  error?: string;
  onAddToInventory?: (
    product: Product,
    quantity: number, // ✅ SIMPLIFIED: Back to simple number
    barcodeType: BarcodeType // ✅ UPDATED: Use BarcodeType enum
  ) => boolean;
  currentInventoryQuantity?: number;

  // ✅ NEW: Additional props for enhanced functionality
  scannedBarcode?: string; // The actual barcode that was scanned
  fullScreen?: boolean;
  showHeader?: boolean;
}

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

  // ✅ Enhanced barcode copy function
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

  // ✅ Determine if inventory add section should be visible
  const shouldShowInventorySection =
    product && !error && onAddToInventory && detectedBarcodeType;

  // ✅ Enhanced logging for debugging
  if (process.env.NODE_ENV === "development") {
    console.log("🔍 ProductInfo Debug:", {
      hasProduct: !!product,
      detectedBarcodeType,
      scannedBarcode,
      barcode,
      isLoading,
      error,
      shouldShowInventorySection,
    });
  }

  // ✅ Handle different states
  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <ErrorState
        error={error}
        barcode={scannedBarcode || barcode}
        detectedBarcodeType={detectedBarcodeType}
      />
    );
  }

  if (!product && !barcode && !scannedBarcode) {
    return <WaitingScanState />;
  }

  if (!product && (barcode || scannedBarcode)) {
    return (
      <ProductNotFoundState
        barcode={scannedBarcode || barcode}
        detectedBarcodeType={detectedBarcodeType}
        onCopyBarcode={copyBarcode}
        copied={copied}
      />
    );
  }

  // ✅ Main product display
  const containerClasses = fullScreen
    ? "h-full bg-white overflow-auto"
    : "bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden";

  return (
    <div className={containerClasses}>
      {/* ✅ Product Header (conditional) */}
      {showHeader && <ProductHeader product={product!} />}

      {/* ✅ Content */}
      <div className="p-4 lg:p-6 space-y-4">
        {/* ✅ Basic Product Information */}
        <ProductBasicInfo
          product={product!}
          currentInventoryQuantity={currentInventoryQuantity}
          detectedBarcodeType={detectedBarcodeType}
        />

        {/* ✅ MAIN FEATURE: Inventory Add Section (only for detected barcode type) */}
        {shouldShowInventorySection && (
          <InventoryAddSection
            product={product!}
            detectedBarcodeType={detectedBarcodeType}
            onAddToInventory={onAddToInventory}
            isVisible={true}
            currentInventoryQuantity={currentInventoryQuantity}
          />
        )}

        {/* ✅ Barcode Information */}
        <BarcodeInfo
          product={product!}
          scannedBarcode={scannedBarcode || barcode}
          detectedBarcodeType={detectedBarcodeType}
          onCopyBarcode={copyBarcode}
          copied={copied}
        />

        {/* ✅ Product Description */}
        {(product!.description ||
          (product as ProductWithMultipleBarcodes)?.thaiDescription) && (
          <ProductDescription
            product={product!}
            thaiDescription={
              (product as ProductWithMultipleBarcodes)?.thaiDescription
            }
          />
        )}

        {/* ✅ Product Details */}
        <ProductDetails product={product!} />

        {/* ✅ Nutrition Information */}
        {product!.nutrition_info && (
          <NutritionInfo nutritionInfo={product!.nutrition_info} />
        )}
      </div>

      {/* ✅ NEW: Enhanced Debug Panel (Development Only) */}
      {process.env.NODE_ENV === "development" && (
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <details className="text-xs text-gray-600">
            <summary className="cursor-pointer font-medium mb-2">
              🔧 Debug Info
            </summary>
            <div className="space-y-1 font-mono">
              <div>Product ID: {product?.id || "N/A"}</div>
              <div>
                Material Code:{" "}
                {(product as ProductWithMultipleBarcodes)?.materialCode ||
                  "N/A"}
              </div>
              <div>Detected Type: {detectedBarcodeType || "None"}</div>
              <div>Scanned Barcode: {scannedBarcode || "N/A"}</div>
              <div>
                Product Group:{" "}
                {(product as ProductWithMultipleBarcodes)?.productGroup ||
                  "N/A"}
              </div>
              <div>Available Barcodes:</div>
              <div className="pl-4">
                <div>
                  EA:{" "}
                  {(product as ProductWithMultipleBarcodes)?.barcodes?.ea ||
                    "N/A"}
                </div>
                <div>
                  DSP:{" "}
                  {(product as ProductWithMultipleBarcodes)?.barcodes?.dsp ||
                    "N/A"}
                </div>
                <div>
                  CS:{" "}
                  {(product as ProductWithMultipleBarcodes)?.barcodes?.cs ||
                    "N/A"}
                </div>
              </div>
              <div>
                Show Inventory Section:{" "}
                {shouldShowInventorySection ? "✅" : "❌"}
              </div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
};
