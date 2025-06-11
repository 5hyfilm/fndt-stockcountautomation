// src/components/product/ProductBasicInfo.tsx
"use client";

import React from "react";
import { Weight, Archive, DollarSign } from "lucide-react";
import { Product } from "../../types/product";
import { formatPrice, formatQuantity } from "./utils";

interface ProductBasicInfoProps {
  product: Product;
  currentInventoryQuantity: number;
}

export const ProductBasicInfo: React.FC<ProductBasicInfoProps> = ({
  product,
  currentInventoryQuantity,
}) => {
  // Helper function to display size information
  const getSizeDisplay = () => {
    // ถ้ามี packSizeInfo (จาก CSV parsing ใหม่)
    if ((product as any).packSizeInfo) {
      return (product as any).packSizeInfo.displayText;
    }

    // ถ้ามี packSize (จาก CSV แบบเก่า)
    if ((product as any).packSize && (product as any).packSize > 1) {
      return `${(product as any).packSize} ชิ้น/แพ็ค`;
    }

    // ถ้ามี size และ unit ปกติ
    if (product.size && product.unit) {
      return `${product.size} ${product.unit}`;
    }

    // ถ้ามีแค่ size
    if (product.size) {
      return `${product.size}`;
    }

    return null;
  };

  const sizeDisplay = getSizeDisplay();

  return (
    <div className="space-y-4">
      {/* Size and Stock Info */}
      <div className="grid grid-cols-2 gap-4">
        {/* แสดง Size card เฉพาะเมื่อมีข้อมูล */}
        {sizeDisplay && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Weight size={16} className="text-gray-500" />
              <span className="text-sm text-gray-600">ขนาดแพ็ค</span>
            </div>
            <p className="font-semibold text-gray-900 text-sm leading-tight">
              {sizeDisplay}
            </p>
          </div>
        )}

        <div
          className={`bg-gray-50 rounded-lg p-3 ${
            !sizeDisplay ? "col-span-2" : ""
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Archive size={16} className="text-purple-500" />
            <span className="text-sm text-gray-600">ใน Stock</span>
          </div>
          <p
            className={`font-semibold ${
              currentInventoryQuantity > 0 ? "text-green-600" : "text-gray-500"
            }`}
          >
            {formatQuantity(currentInventoryQuantity, "ชิ้น")}
          </p>
        </div>
      </div>

      {/* Price Info */}
      {product.price && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={16} className="text-green-500" />
            <span className="text-sm text-green-700">ราคา</span>
          </div>
          <p className="font-semibold text-green-600 text-lg">
            {formatPrice(product.price, product.currency)}
          </p>
        </div>
      )}
    </div>
  );
};
