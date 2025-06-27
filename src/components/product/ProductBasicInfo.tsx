// Path: src/components/product/ProductBasicInfo.tsx
// Updated with barcode type detection support

"use client";

import React from "react";
import {
  Weight,
  Archive,
  Scan,
  Package,
  Package2,
  CheckCircle2,
} from "lucide-react";
import { Product, BarcodeType, BarcodeUtils } from "../../types/product";
import {
  ProductWithMultipleBarcodes,
  CSVUtils,
} from "../../data/types/csvTypes";
import { formatPrice, formatQuantity } from "./utils";

// Extended interface for products with additional properties
interface ExtendedProduct extends Product {
  packSizeInfo?: {
    displayText: string;
    count?: number;
  };
  packSize?: number;
}

interface ProductBasicInfoProps {
  product: Product | ProductWithMultipleBarcodes;
  currentInventoryQuantity?: number;
  detectedBarcodeType?: BarcodeType | null; // ✅ NEW: Which barcode was detected
}

export const ProductBasicInfo: React.FC<ProductBasicInfoProps> = ({
  product,
  currentInventoryQuantity = 0,
  detectedBarcodeType,
}) => {
  // Cast product to extended types
  const extendedProduct = product as ExtendedProduct;
  const productWithBarcodes = product as ProductWithMultipleBarcodes;

  // ✅ Get available barcode types for this product
  const availableBarcodeTypes = productWithBarcodes.barcodes
    ? CSVUtils.getAvailableBarcodeTypes(productWithBarcodes)
    : [];

  // ✅ Helper function to display size information
  const getSizeDisplay = (): string | null => {
    // If has packSizeInfo (from new CSV parsing)
    if (extendedProduct.packSizeInfo?.displayText) {
      return extendedProduct.packSizeInfo.displayText;
    }

    // If has packSize (from old CSV)
    if (extendedProduct.packSize && extendedProduct.packSize > 1) {
      return `${extendedProduct.packSize} ชิ้น/แพ็ค`;
    }

    // If has regular size and unit
    if (product.size && product.unit) {
      return `${product.size} ${product.unit}`;
    }

    // If has only size
    if (product.size) {
      return product.size;
    }

    return null;
  };

  // ✅ Get unit configuration for detected barcode type
  const getUnitConfig = (type: BarcodeType) => {
    const configs = {
      [BarcodeType.EA]: {
        icon: Package2,
        label: "ชิ้น",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
      },
      [BarcodeType.DSP]: {
        icon: Package,
        label: "แพ็ค",
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
      },
      [BarcodeType.CS]: {
        icon: Archive,
        label: "ลัง",
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-200",
      },
    };
    return configs[type];
  };

  const sizeDisplay = getSizeDisplay();

  return (
    <div className="space-y-4">
      {/* ✅ NEW: Detected Barcode Type Section */}
      {detectedBarcodeType && (
        <div className="bg-gradient-to-r from-fn-green/5 to-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-fn-green/10 rounded-lg flex items-center justify-center">
                <Scan size={20} className="text-fn-green" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  ตรวจจับบาร์โค้ดสำเร็จ
                  <CheckCircle2 size={16} className="text-fn-green" />
                </h3>
                <p className="text-sm text-gray-600">
                  ระบบตรวจจับหน่วย{" "}
                  <span className="font-medium text-fn-green">
                    {BarcodeUtils.getUnitLabel(detectedBarcodeType)}
                  </span>
                </p>
              </div>
            </div>

            {/* ✅ Unit Type Badge */}
            <div
              className={`px-3 py-1.5 rounded-lg border ${
                getUnitConfig(detectedBarcodeType).bgColor
              } ${
                getUnitConfig(detectedBarcodeType).borderColor
              } flex items-center gap-2`}
            >
              {React.createElement(getUnitConfig(detectedBarcodeType).icon, {
                size: 16,
                className: getUnitConfig(detectedBarcodeType).color,
              })}
              <span
                className={`text-sm font-medium ${
                  getUnitConfig(detectedBarcodeType).color
                }`}
              >
                {detectedBarcodeType.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Available Barcode Types (if multiple) */}
      {availableBarcodeTypes.length > 1 && (
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mt-0.5">
              <Package size={14} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                หน่วยที่สามารถสแกนได้
              </h4>
              <div className="flex flex-wrap gap-2">
                {availableBarcodeTypes.map((type) => {
                  const config = getUnitConfig(type);
                  const isDetected = type === detectedBarcodeType;

                  return (
                    <div
                      key={type}
                      className={`
                        flex items-center gap-1.5 px-2 py-1 rounded text-xs border
                        ${
                          isDetected
                            ? "bg-fn-green text-white border-fn-green"
                            : "bg-white text-gray-600 border-gray-300"
                        }
                      `}
                    >
                      {React.createElement(config.icon, { size: 12 })}
                      <span>{type.toUpperCase()}</span>
                      {isDetected && <CheckCircle2 size={10} />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Product Information Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Size Information (only if available) */}
        {sizeDisplay && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Weight size={16} className="text-gray-500" />
              <span className="text-sm text-gray-600">ขนาดสินค้า</span>
            </div>
            <p className="font-semibold text-gray-900 text-sm leading-tight">
              {sizeDisplay}
            </p>
          </div>
        )}

        {/* ✅ Current Inventory Status */}
        <div
          className={`bg-gray-50 rounded-lg p-3 ${
            !sizeDisplay ? "col-span-2" : ""
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Archive size={16} className="text-purple-500" />
            <span className="text-sm text-gray-600">
              ในคลัง
              {detectedBarcodeType && (
                <span className="ml-1 text-xs text-purple-600">
                  ({BarcodeUtils.getUnitAbbr(detectedBarcodeType)})
                </span>
              )}
            </span>
          </div>
          <p
            className={`font-semibold text-sm ${
              currentInventoryQuantity > 0 ? "text-green-600" : "text-gray-400"
            }`}
          >
            {currentInventoryQuantity > 0
              ? `${currentInventoryQuantity} ${
                  detectedBarcodeType
                    ? BarcodeUtils.getUnitLabel(detectedBarcodeType)
                    : "ชิ้น"
                }`
              : "ยังไม่มีในคลัง"}
          </p>
        </div>
      </div>

      {/* ✅ Product Metadata */}
      <div className="grid grid-cols-2 gap-4">
        {/* Material Code / SKU */}
        {(productWithBarcodes.materialCode || product.sku) && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Package size={16} className="text-gray-500" />
              <span className="text-sm text-gray-600">รหัสสินค้า</span>
            </div>
            <p className="font-mono text-sm font-medium text-gray-900">
              {productWithBarcodes.materialCode || product.sku}
            </p>
          </div>
        )}

        {/* Product Group */}
        {productWithBarcodes.productGroup && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Archive size={16} className="text-gray-500" />
              <span className="text-sm text-gray-600">กลุ่มสินค้า</span>
            </div>
            <p className="text-sm font-medium text-gray-900">
              {productWithBarcodes.productGroup}
            </p>
          </div>
        )}
      </div>

      {/* ✅ Price Information (if available) */}
      {product.price && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3 border border-yellow-200">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">💰</span>
            <span className="text-sm text-yellow-700">ราคา</span>
          </div>
          <p className="text-lg font-bold text-yellow-800">
            {formatPrice(product.price, product.currency)}
          </p>
        </div>
      )}

      {/* ✅ Development Debug Panel */}
      {process.env.NODE_ENV === "development" && (
        <div className="bg-gray-100 rounded-lg p-3 border border-gray-300">
          <details className="text-xs">
            <summary className="cursor-pointer font-medium text-gray-700 mb-2">
              🔧 Debug: Product Info
            </summary>
            <div className="space-y-1 font-mono text-gray-600">
              <div>ID: {product.id}</div>
              <div>
                Material Code: {productWithBarcodes.materialCode || "N/A"}
              </div>
              <div>Detected Type: {detectedBarcodeType || "None"}</div>
              <div>Available Types: [{availableBarcodeTypes.join(", ")}]</div>
              <div>Current Quantity: {currentInventoryQuantity}</div>
              <div>
                Product Group: {productWithBarcodes.productGroup || "N/A"}
              </div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
};
