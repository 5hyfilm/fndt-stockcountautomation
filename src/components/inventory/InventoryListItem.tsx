// ./src/components/inventory/InventoryListItem.tsx
"use client";

import React from "react";
import {
  Package,
  Edit3,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
  X,
} from "lucide-react";
import { InventoryItem } from "../../hooks/useInventoryManager";

interface InventoryListItemProps {
  item: InventoryItem;
  isEditing: boolean;
  editQuantity: number;
  onEditStart: () => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onEditQuantityChange: (quantity: number) => void;
  onQuickAdjust: (delta: number) => void;
  onRemove: () => void;
}

// Extended types for pack size information
interface PackSizeInfo {
  displayText: string;
  count?: number;
  unit?: string;
}

interface ExtendedInventoryItem extends InventoryItem {
  packSizeInfo?: PackSizeInfo;
  packSize?: number;
}

interface ExtendedProductData {
  packSizeInfo?: PackSizeInfo;
  packSize?: number;
}

export const InventoryListItem: React.FC<InventoryListItemProps> = ({
  item,
  isEditing,
  editQuantity,
  onEditStart,
  onEditSave,
  onEditCancel,
  onEditQuantityChange,
  onQuickAdjust,
  onRemove,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ฟังก์ชันสำหรับแสดงขนาดสินค้า (ใช้ logic เดียวกับ ProductBasicInfo)
  const getSizeDisplay = (): string | null => {
    const extendedItem = item as ExtendedInventoryItem;
    const extendedProductData = item.productData as
      | ExtendedProductData
      | undefined;

    // ถ้ามี packSizeInfo (จาก CSV parsing ใหม่)
    if (extendedItem.packSizeInfo) {
      return extendedItem.packSizeInfo.displayText;
    }

    // ถ้ามี packSize (จาก CSV แบบเก่า)
    if (extendedItem.packSize && extendedItem.packSize > 1) {
      return `${extendedItem.packSize} ชิ้น/แพ็ค`;
    }

    // ถ้ามี productData และมี packSizeInfo ใน productData
    if (extendedProductData?.packSizeInfo) {
      return extendedProductData.packSizeInfo.displayText;
    }

    // ถ้ามี productData และมี packSize ใน productData
    if (extendedProductData?.packSize && extendedProductData.packSize > 1) {
      return `${extendedProductData.packSize} ชิ้น/แพ็ค`;
    }

    // ถ้ามี size และ unit ปกติ
    if (item.size && item.unit) {
      return `${item.size} ${item.unit}`;
    }

    // ถ้ามีแค่ size
    if (item.size) {
      return `${item.size}`;
    }

    return null;
  };

  const sizeDisplay = getSizeDisplay();

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-fn-green/10 p-2 rounded-lg">
              <Package className="text-fn-green" size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">
                {item.productName}
              </h3>
              {/* Brand & Category - แสดงในบรรทัดแรก */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs font-medium">
                  {item.brand}
                </span>
                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md text-xs font-medium">
                  {item.category}
                </span>
              </div>
            </div>
          </div>

          {/* Size & Barcode - แสดงในบรรทัดที่สอง */}
          <div className="ml-11 space-y-1">
            {sizeDisplay && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-gray-500">ขนาด:</span>
                <span className="font-medium">{sizeDisplay}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>บาร์โค้ด:</span>
              <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                {item.barcode}
              </span>
            </div>
            <div className="text-xs text-gray-400">
              อัปเดตล่าสุด: {formatDate(item.lastUpdated)}
            </div>
          </div>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center gap-3 ml-4">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  onEditQuantityChange(Math.max(0, editQuantity - 1))
                }
                className="p-1 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-600"
              >
                <Minus size={14} />
              </button>
              <input
                type="number"
                value={editQuantity}
                onChange={(e) =>
                  onEditQuantityChange(parseInt(e.target.value) || 0)
                }
                className="w-16 text-center border border-gray-300 rounded-lg py-1 text-sm focus:outline-none focus:ring-2 focus:ring-fn-green focus:border-fn-green"
                min="0"
              />
              <button
                onClick={() => onEditQuantityChange(editQuantity + 1)}
                className="p-1 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-600"
              >
                <Plus size={14} />
              </button>
              <div className="flex gap-1 ml-2">
                <button
                  onClick={onEditSave}
                  className="p-1.5 rounded-lg bg-green-100 hover:bg-green-200 text-green-600"
                >
                  <CheckCircle size={14} />
                </button>
                <button
                  onClick={onEditCancel}
                  className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {/* Quantity Display */}
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900">
                  {item.quantity.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">{item.unit}</div>
              </div>

              {/* Quick Adjust Buttons */}
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => onQuickAdjust(1)}
                  className="p-1 rounded-md bg-green-100 hover:bg-green-200 text-green-600 text-xs"
                >
                  <Plus size={12} />
                </button>
                <button
                  onClick={() => onQuickAdjust(-1)}
                  className="p-1 rounded-md bg-red-100 hover:bg-red-200 text-red-600 text-xs"
                  disabled={item.quantity <= 0}
                >
                  <Minus size={12} />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={onEditStart}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-600"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={onRemove}
                  className="p-2 rounded-lg border border-red-300 hover:bg-red-50 text-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
