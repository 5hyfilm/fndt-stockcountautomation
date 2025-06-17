// src/components/sections/ProductInfoSection.tsx - Updated with Dual Unit Support

"use client";

import React from "react";
import { ProductWithMultipleBarcodes } from "../../data/types/csvTypes";
import { DualUnitInputData } from "../../hooks/inventory/types";
import { Product } from "../../types/product";

// Import product components
import {
  ProductHeader,
  ProductBasicInfo,
  InventoryAddSection,
  ProductDescription,
  BarcodeInfo,
  ProductDetails,
  NutritionInfo,
  LoadingState,
  ErrorState,
  WaitingScanState,
  ProductNotFoundState,
} from "../product";

interface ProductInfoSectionProps {
  product: ProductWithMultipleBarcodes | null;
  detectedBarcodeType?: "ea" | "dsp" | "cs";
  isLoadingProduct: boolean;
  productError: string | null;
  lastDetectedCode: string | null;
  currentInventoryQuantity: number;
  onAddToInventory: (
    product: Product,
    quantity: number,
    barcodeType?: "ea" | "dsp" | "cs"
  ) => boolean;
  onAddToInventoryDualUnit?: (
    // ✅ NEW - Dual unit method
    product: Product,
    dualUnitData: DualUnitInputData
  ) => boolean;
  onClearError: () => void;
  onRestartScan: () => void;
}

export const ProductInfoSection: React.FC<ProductInfoSectionProps> = ({
  product,
  detectedBarcodeType,
  isLoadingProduct,
  productError,
  lastDetectedCode,
  currentInventoryQuantity,
  onAddToInventory,
  onAddToInventoryDualUnit, // ✅ NEW
  onClearError,
  onRestartScan,
}) => {
  // Loading state
  if (isLoadingProduct) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <LoadingState />
      </div>
    );
  }

  // Error state
  if (productError) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <ErrorState
          error={productError}
          onClearError={onClearError}
          onRestartScan={onRestartScan}
        />
      </div>
    );
  }

  // Product not found state
  if (lastDetectedCode && !product) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <ProductNotFoundState
          barcode={lastDetectedCode}
          onRestartScan={onRestartScan}
        />
      </div>
    );
  }

  // Waiting for scan state
  if (!product && !lastDetectedCode) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <WaitingScanState />
      </div>
    );
  }

  // Product found - display product information
  if (product) {
    return (
      <div className="space-y-6">
        {/* Product Header */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <ProductHeader
            product={product}
            detectedBarcodeType={detectedBarcodeType}
            currentInventoryQuantity={currentInventoryQuantity}
          />
        </div>

        {/* Product Basic Info */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <ProductBasicInfo product={product} />
        </div>

        {/* ✅ Updated Inventory Add Section with Dual Unit Support */}
        <InventoryAddSection
          product={product}
          currentInventoryQuantity={currentInventoryQuantity}
          onAddToInventory={onAddToInventory}
          onAddToInventoryDualUnit={onAddToInventoryDualUnit} // NEW
          isVisible={true}
          barcodeType={detectedBarcodeType}
        />

        {/* Product Description */}
        {(product.description || product.thaiDescription) && (
          <div className="bg-white rounded-lg shadow-md border border-gray-200">
            <ProductDescription product={product} />
          </div>
        )}

        {/* Barcode Information */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <BarcodeInfo
            product={product}
            detectedBarcodeType={detectedBarcodeType}
          />
        </div>

        {/* Product Details */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <ProductDetails product={product} />
        </div>

        {/* Nutrition Information */}
        {product.nutrition_info && (
          <div className="bg-white rounded-lg shadow-md border border-gray-200">
            <NutritionInfo product={product} />
          </div>
        )}

        {/* Restart Scan Button */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <button
            onClick={onRestartScan}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            สแกนสินค้าถัดไป
          </button>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <WaitingScanState />
    </div>
  );
};
