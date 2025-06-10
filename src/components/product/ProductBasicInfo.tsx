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
  return (
    <div className="space-y-4">
      {/* Size and Stock Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Weight size={16} className="text-gray-500" />
            <span className="text-sm text-gray-600">ขนาด</span>
          </div>
          <p className="font-semibold text-gray-900">
            {product.size} {product.unit}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Archive size={16} className="text-purple-500" />
            <span className="text-sm text-gray-600">ใน Stock</span>
          </div>
          <p
            className={`font-semibold ${
              currentInventoryQuantity > 0 ? "text-green-600" : "text-gray-500"
            }`}
          >
            {formatQuantity(currentInventoryQuantity, product.unit)}
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
