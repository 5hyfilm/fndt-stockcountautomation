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

  // ✅ FIXED: Format dual unit display properly - แสดงตามที่กรอกจริงไม่แปลงหน่วย
  const formatDualUnitDisplay = (): string => {
    const csCount = item.csCount || 0;
    const pieceCount = item.pieceCount || 0;
    const csUnitType = item.csUnitType;
    const pieceUnitType = item.pieceUnitType;

    console.log("🎯 formatDualUnitDisplay DEBUG:", {
      productName: item.productName,
      csCount,
      pieceCount,
      csUnitType,
      pieceUnitType,
      shouldShowBoth: csCount > 0 && pieceCount > 0,
    });

    const csLabel = getUnitTypeDisplay(csUnitType);
    const pieceLabel = getUnitTypeDisplay(pieceUnitType);

    // ✅ FIXED: แสดงผลตามที่กรอกจริง ไม่แปลงหน่วยอัตโนมัติ
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

  // ✅ FIXED: Check if item has any dual unit values
  const hasDualUnitValues = (): boolean => {
    return (item.csCount || 0) > 0 || (item.pieceCount || 0) > 0;
  };

  // ✅ Debug: Log item data for troubleshooting
  console.log("🔍 InventoryListItem Render:", {
    productName: item.productName,
    csCount: item.csCount,
    pieceCount: item.pieceCount,
    csUnitType: item.csUnitType,
    pieceUnitType: item.pieceUnitType,
    quantity: item.quantity,
    isDualUnit: isDualUnit(),
    hasDualUnitValues: hasDualUnitValues(),
    formatDualUnitDisplay: formatDualUnitDisplay(),
  });

  // ✅ Get size display
  const getSizeDisplay = (): string | null => {
    if (item.size && item.unit) {
      return `${item.size} ${item.unit}`;
    }
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
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {item.productName}
              </h3>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                  {item.barcode}
                </span>
                {item.brand && (
                  <span className="text-fn-green font-medium">
                    {item.brand}
                  </span>
                )}
                {sizeDisplay && <span>{sizeDisplay}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Quantity Display/Edit Section */}
        <div className="flex items-center gap-3">
          {isEditing ? (
            /* Edit Mode - Standard quantity editing */
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
              <div className="text-right min-w-[180px]">
                {isDualUnit() && hasDualUnitValues() ? (
                  /* ✅ FIXED: Dual Unit Display - แสดงตามที่กรอกจริง */
                  <div className="space-y-2">
                    {/* ✅ Main Display: แสดงสรุปตามที่กรอกจริง */}
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
                    </div>

                    {/* ✅ เพิ่ม note เล็กๆ สำหรับการแสดงข้อมูล */}
                    <div className="text-xs text-gray-400 text-center">
                      แสดงตามที่กรอกจริง
                    </div>
                  </div>
                ) : (
                  /* ✅ Single Unit Display */
                  <div className="text-lg font-bold text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 justify-end">
                      <ShoppingCart size={16} className="text-gray-600" />
                      <span>{item.quantity || 0}</span>
                      <span className="text-sm text-gray-600">ชิ้น</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onQuickAdjust(-1)}
                  className="p-1 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-800"
                  disabled={item.quantity <= 1}
                >
                  <Minus size={14} />
                </button>
                <button
                  onClick={() => onQuickAdjust(1)}
                  className="p-1 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-800"
                >
                  <Plus size={14} />
                </button>
                <button
                  onClick={onEditStart}
                  className="p-1 hover:bg-blue-100 rounded text-blue-600 hover:text-blue-800 ml-1"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={onRemove}
                  className="p-1 hover:bg-red-100 rounded text-red-600 hover:text-red-800"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <span>เพิ่มเมื่อ: {formatDate(item.addedAt)}</span>
            {item.addedBy && <span>โดย: {item.addedBy}</span>}
          </div>
          {item.lastUpdated && item.lastUpdated !== item.addedAt && (
            <span>แก้ไขล่าสุด: {formatDate(item.lastUpdated)}</span>
          )}
        </div>
      </div>
    </div>
  );
};
