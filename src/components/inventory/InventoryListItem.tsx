// src/components/inventory/InventoryListItem.tsx - FIXED VERSION
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
  Package2,
  Box,
  ShoppingCart,
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
  onUpdateDualUnit?: (csCount: number, pieceCount: number) => void;
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
  onUpdateDualUnit,
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

  // ฟังก์ชันสำหรับแสดงขนาดสินค้า
  const getSizeDisplay = (): string | null => {
    const extendedItem = item as ExtendedInventoryItem;
    const extendedProductData = item.productData as
      | ExtendedProductData
      | undefined;

    if (extendedItem.packSizeInfo) {
      return extendedItem.packSizeInfo.displayText;
    }

    if (extendedItem.packSize && extendedItem.packSize > 1) {
      return `${extendedItem.packSize} ชิ้น/แพ็ค`;
    }

    if (extendedProductData?.packSizeInfo) {
      return extendedProductData.packSizeInfo.displayText;
    }

    if (extendedProductData?.packSize && extendedProductData.packSize > 1) {
      return `${extendedProductData.packSize} ชิ้น/แพ็ค`;
    }

    if (item.size && item.unit) {
      return `${item.size} ${item.unit}`;
    }

    if (item.size) {
      return `${item.size}`;
    }

    return null;
  };

  // ✅ FIXED: Get unit type display
  const getUnitTypeDisplay = (unitType: string | null | undefined): string => {
    switch (unitType) {
      case "cs":
        return "ลัง";
      case "dsp":
        return "แพ็ค";
      case "ea":
        return "ชิ้น";
      case "fractional":
        return "เศษ";
      default:
        return "หน่วย";
    }
  };

  // ✅ FIXED: Format dual unit display properly
  const formatDualUnitDisplay = (): string => {
    const csCount = item.csCount || 0;
    const pieceCount = item.pieceCount || 0;
    const csUnitType = item.csUnitType;
    const pieceUnitType = item.pieceUnitType;

    const csLabel = getUnitTypeDisplay(csUnitType);
    const pieceLabel = getUnitTypeDisplay(pieceUnitType);

    if (csCount > 0 && pieceCount > 0) {
      return `${csCount} ${csLabel} + ${pieceCount} ${pieceLabel}`;
    } else if (csCount > 0) {
      return `${csCount} ${csLabel}`;
    } else if (pieceCount > 0) {
      return `${pieceCount} ${pieceLabel}`;
    } else {
      return "0";
    }
  };

  // ✅ FIXED: Check if item uses dual unit system
  const isDualUnit = (): boolean => {
    return (
      item.csCount !== undefined &&
      item.pieceCount !== undefined &&
      (item.csUnitType !== undefined || item.pieceUnitType !== undefined)
    );
  };

  // ✅ Debug: Log item data
  console.log("🔍 InventoryListItem Debug:", {
    productName: item.productName,
    csCount: item.csCount,
    pieceCount: item.pieceCount,
    csUnitType: item.csUnitType,
    pieceUnitType: item.pieceUnitType,
    quantity: item.quantity,
    isDualUnit: isDualUnit(),
    formatDualUnitDisplay: formatDualUnitDisplay(),
  });

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
              {/* Brand & Category */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs font-medium">
                  {item.brand}
                </span>
                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md text-xs font-medium">
                  {item.category}
                </span>
                {item.barcodeType && (
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs font-medium">
                    {item.barcodeType.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Size & Barcode */}
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

        {/* ✅ FIXED: Quantity Display & Controls */}
        <div className="flex items-center gap-4 ml-4">
          {isEditing ? (
            /* Edit Mode */
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg p-2">
              <button
                onClick={() =>
                  onEditQuantityChange(Math.max(0, editQuantity - 1))
                }
                className="p-1 hover:bg-blue-100 rounded"
                disabled={editQuantity <= 0}
              >
                <Minus size={16} className="text-blue-600" />
              </button>
              <input
                type="number"
                value={editQuantity}
                onChange={(e) => onEditQuantityChange(Number(e.target.value))}
                className="w-16 text-center border border-blue-300 rounded px-2 py-1 text-sm"
                min="0"
              />
              <button
                onClick={() => onEditQuantityChange(editQuantity + 1)}
                className="p-1 hover:bg-blue-100 rounded"
              >
                <Plus size={16} className="text-blue-600" />
              </button>
              <button
                onClick={onEditSave}
                className="p-1 hover:bg-green-100 rounded ml-2"
              >
                <CheckCircle size={16} className="text-green-600" />
              </button>
              <button
                onClick={onEditCancel}
                className="p-1 hover:bg-red-100 rounded"
              >
                <X size={16} className="text-red-600" />
              </button>
            </div>
          ) : (
            /* ✅ FIXED: Display Mode */
            <div className="flex items-center gap-4">
              {/* Quantity Display */}
              <div className="text-right min-w-[160px]">
                {isDualUnit() ? (
                  /* ✅ Dual Unit Display */
                  <div className="space-y-2">
                    {/* ✅ Main Display: แสดงตามที่กรอกจริง */}
                    <div className="text-lg font-bold text-blue-900 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                      {formatDualUnitDisplay()}
                    </div>

                    {/* ✅ Detailed breakdown */}
                    <div className="space-y-1 text-sm">
                      {(item.csCount || 0) > 0 && (
                        <div className="flex items-center gap-2 justify-end text-blue-700">
                          <Package2 size={14} />
                          <span className="font-medium">{item.csCount}</span>
                          <span className="text-gray-600">
                            {getUnitTypeDisplay(item.csUnitType)}
                          </span>
                        </div>
                      )}
                      {(item.pieceCount || 0) > 0 && (
                        <div className="flex items-center gap-2 justify-end text-green-700">
                          <Box size={14} />
                          <span className="font-medium">{item.pieceCount}</span>
                          <span className="text-gray-600">
                            {getUnitTypeDisplay(item.pieceUnitType)}
                          </span>
                        </div>
                      )}

                      {/* Legacy compatibility info */}
                      <div className="flex items-center gap-2 justify-end text-gray-500 text-xs border-t border-gray-200 pt-1 mt-2">
                        <ShoppingCart size={12} />
                        <span>รวม: {item.quantity} ชิ้น</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Legacy Single Unit Display */
                  <div className="text-lg font-bold text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                    {item.quantity} {item.unit || "ชิ้น"}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onQuickAdjust(-1)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={item.quantity <= 0}
                >
                  <Minus size={16} className="text-gray-600" />
                </button>
                <button
                  onClick={() => onQuickAdjust(1)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Plus size={16} className="text-gray-600" />
                </button>
                <button
                  onClick={onEditStart}
                  className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <Edit3 size={16} className="text-blue-600" />
                </button>
                <button
                  onClick={onRemove}
                  className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <Trash2 size={16} className="text-red-600" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
