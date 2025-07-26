// src/components/product/ProductDetails.tsx
"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Package, Tag, Ruler } from "lucide-react";
import { Product } from "../../types/product";

interface ProductDetailsProps {
  product: Product;
}

export const ProductDetails: React.FC<ProductDetailsProps> = ({ product }) => {
  const [showDetails, setShowDetails] = useState(false);

  // ✅ Check if there are any details to show using existing Product fields
  const hasDetails =
    product.materialCode ||
    product.size ||
    product.unit ||
    product.category ||
    product.thaiDescription ||
    product.shortDescription ||
    product.productGroup ||
    product.price ||
    product.status;

  if (!hasDetails) return null;

  return (
    <div className="space-y-3">
      {/* Toggle Button */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <span className="text-sm font-medium text-gray-700">
          ข้อมูลเพิ่มเติม
        </span>
        {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {/* Detailed Information */}
      {showDetails && (
        <div className="space-y-3 border-t pt-4">
          {/* ✅ Material Code แทน SKU */}
          {product.materialCode && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <Package size={12} />
                รหัสสินค้า:
              </span>
              <span className="text-sm font-mono">{product.materialCode}</span>
            </div>
          )}

          {/* ✅ Category */}
          {product.category && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <Tag size={12} />
                หมวดหมู่:
              </span>
              <span className="text-sm">{product.category}</span>
            </div>
          )}

          {/* ✅ Size and Unit */}
          {(product.size || product.unit) && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <Ruler size={12} />
                ขนาด/หน่วย:
              </span>
              <span className="text-sm">
                {[product.size, product.unit].filter(Boolean).join(" / ")}
              </span>
            </div>
          )}

          {/* ✅ Product Group */}
          {product.productGroup && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">กลุ่มสินค้า:</span>
              <span className="text-sm">{product.productGroup}</span>
            </div>
          )}

          {/* ✅ Price */}
          {product.price && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">ราคา:</span>
              <span className="text-sm font-medium text-green-600">
                ฿{product.price.toLocaleString()}
                {product.currency &&
                  product.currency !== "THB" &&
                  ` ${product.currency}`}
              </span>
            </div>
          )}

          {/* ✅ Price per Unit */}
          {product.pricePerUnit && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">ราคาต่อหน่วย:</span>
              <span className="text-sm text-green-600">
                ฿{product.pricePerUnit.toLocaleString()}/
                {product.unit || "หน่วย"}
              </span>
            </div>
          )}

          {/* ✅ Thai Description แทน Storage Instructions */}
          {product.thaiDescription && (
            <div>
              <span className="text-sm text-gray-600 block mb-1">
                รายละเอียด:
              </span>
              <p className="text-sm text-gray-800 bg-blue-50 p-2 rounded border border-blue-200">
                {product.thaiDescription}
              </p>
            </div>
          )}

          {/* ✅ Short Description */}
          {product.shortDescription &&
            product.shortDescription !== product.thaiDescription && (
              <div>
                <span className="text-sm text-gray-600 block mb-1">
                  คำอธิบายสั้น:
                </span>
                <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                  {product.shortDescription}
                </p>
              </div>
            )}

          {/* ✅ Status */}
          {product.status && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">สถานะ:</span>
              <span
                className={`text-sm px-2 py-1 rounded-full text-xs ${
                  product.status === "active"
                    ? "bg-green-100 text-green-700"
                    : product.status === "inactive"
                    ? "bg-red-100 text-red-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {product.status === "active"
                  ? "ใช้งาน"
                  : product.status === "inactive"
                  ? "ไม่ใช้งาน"
                  : product.status === "discontinued"
                  ? "หยุดผลิต"
                  : product.status === "out_of_stock"
                  ? "หมดสต็อก"
                  : product.status}
              </span>
            </div>
          )}

          {/* ✅ Created/Updated Times */}
          {(product.createdAt || product.updatedAt) && (
            <div className="border-t pt-2 mt-3">
              {product.createdAt && (
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-gray-500">วันที่สร้าง:</span>
                  <span className="text-xs text-gray-500">
                    {new Date(product.createdAt).toLocaleDateString("th-TH")}
                  </span>
                </div>
              )}
              {product.updatedAt && (
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">วันที่อัปเดต:</span>
                  <span className="text-xs text-gray-500">
                    {new Date(product.updatedAt).toLocaleDateString("th-TH")}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
