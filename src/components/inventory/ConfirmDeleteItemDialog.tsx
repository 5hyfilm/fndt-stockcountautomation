// src/components/inventory/ConfirmDeleteItemDialog.tsx
"use client";

import React from "react";
import {
  AlertTriangle,
  Trash2,
  X,
  Package2,
  Package,
  Archive,
} from "lucide-react";
import { InventoryItem } from "../../hooks/inventory/types";

interface ConfirmDeleteItemDialogProps {
  isOpen: boolean;
  item: InventoryItem | null;
  onConfirm: (itemId: string) => void;
  onCancel: () => void;
}

// ✅ Unit configuration for display
const UNIT_CONFIG = {
  ea: {
    label: "ชิ้น",
    shortLabel: "EA",
    icon: Package2,
    color: "bg-blue-100 text-blue-700",
  },
  dsp: {
    label: "แพ็ค",
    shortLabel: "DSP",
    icon: Package,
    color: "bg-green-100 text-green-700",
  },
  cs: {
    label: "ลัง",
    shortLabel: "CS",
    icon: Archive,
    color: "bg-purple-100 text-purple-700",
  },
};

// ✅ Helper function to check if item is new product
const isNewProduct = (item: InventoryItem): boolean => {
  return (
    !item.materialCode ||
    item.materialCode.trim() === "" ||
    item.materialCode.startsWith("NEW_") ||
    item.productName?.startsWith("FG")
  );
};

// ✅ Helper function to get product display name
const getProductDisplayName = (item: InventoryItem): string => {
  if (isNewProduct(item)) {
    // For new products, show description from productData, thaiDescription, or productName
    return (
      item.productData?.description ||
      item.thaiDescription ||
      item.productName ||
      "สินค้าไม่ระบุชื่อ"
    );
  } else {
    // For existing products, show productName
    return item.productName || "สินค้าไม่ระบุชื่อ";
  }
};

// ✅ Helper function to format quantity display
const formatQuantityDisplay = (item: InventoryItem): string => {
  const barcodeType = item.barcodeType || "ea";
  const unitConfig = UNIT_CONFIG[barcodeType];

  if (item.quantityDetail && (barcodeType === "dsp" || barcodeType === "cs")) {
    const { major, remainder } = item.quantityDetail;
    if (remainder && remainder > 0) {
      return `${major} ${unitConfig.label} + ${remainder} ชิ้น`;
    }
    return `${major} ${unitConfig.label}`;
  }

  return `${item.quantity} ${unitConfig.label}`;
};

export const ConfirmDeleteItemDialog: React.FC<
  ConfirmDeleteItemDialogProps
> = ({ isOpen, item, onConfirm, onCancel }) => {
  if (!isOpen || !item) return null;

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  // Handle confirm action
  const handleConfirm = () => {
    onConfirm(item.id);
  };

  // Get unit configuration
  const barcodeType = item.barcodeType || "ea";
  const unitConfig = UNIT_CONFIG[barcodeType];
  const UnitIcon = unitConfig.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full mx-4 overflow-hidden">
        {/* Header - Red bar consistent with delete theme */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Trash2 size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold">ยืนยันการลบรายการ</h2>
                <p className="text-red-100 text-sm">
                  กรุณายืนยันก่อนลบรายการสินค้านี้
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {/* Product Information Card */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              {/* Product Icon */}
              <div
                className={`p-2 rounded-lg flex-shrink-0 ${unitConfig.color}`}
              >
                <UnitIcon size={20} />
              </div>

              {/* Product Details */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 mb-1 break-words">
                  {getProductDisplayName(item)}
                </h3>
                <div className="text-sm text-gray-600 space-y-1">
                  {/* Product Code */}
                  <p className="flex items-center gap-2">
                    <span className="text-gray-500">รหัส:</span>
                    <span className="font-mono">
                      {item.materialCode || item.barcode || "ไม่มีรหัส"}
                    </span>
                  </p>

                  {/* Category */}
                  <p className="flex items-center gap-2">
                    <span className="text-gray-500">หมวดหมู่:</span>
                    <span>
                      {item.productGroup || item.category || "ไม่ระบุ"}
                    </span>
                  </p>

                  {/* Brand */}
                  {item.brand && (
                    <p className="flex items-center gap-2">
                      <span className="text-gray-500">แบรนด์:</span>
                      <span>{item.brand}</span>
                    </p>
                  )}

                  {/* Barcode */}
                  <p className="flex items-center gap-2">
                    <span className="text-gray-500">บาร์โค้ด:</span>
                    <span className="font-mono text-xs">{item.barcode}</span>
                  </p>

                  {/* Quantity */}
                  <p className="flex items-center gap-2">
                    <span className="text-gray-500">จำนวน:</span>
                    <span className="font-semibold text-red-600">
                      {formatQuantityDisplay(item)}
                    </span>
                  </p>

                  {/* New Product Indicator */}
                  {isNewProduct(item) && (
                    <span className="inline-block text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                      สินค้าใหม่
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Warning message */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-amber-600 mt-0.5" size={18} />
              <div>
                <div className="font-medium text-amber-800">คำเตือน</div>
                <div className="text-sm text-amber-700 mt-1">
                  รายการสินค้านี้จะถูกลบออกจาก inventory อย่างถาวร
                  การดำเนินการนี้ไม่สามารถย้อนกลับได้
                </div>
              </div>
            </div>
          </div>

          {/* Confirmation message */}
          <div className="text-center text-gray-700 mb-6">
            คุณต้องการลบรายการสินค้านี้ใช่หรือไม่?
            <div className="text-sm text-red-600 mt-2">
              ข้อมูลจะถูกลบอย่างถาวร
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 size={16} />
              ลบรายการ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
