// src/components/inventory/InventoryListItem.tsx
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
  const getSizeDisplay = () => {
    // ถ้ามี packSizeInfo (จาก CSV parsing ใหม่)
    if ((item as any).packSizeInfo) {
      return (item as any).packSizeInfo.displayText;
    }

    // ถ้ามี packSize (จาก CSV แบบเก่า)
    if ((item as any).packSize && (item as any).packSize > 1) {
      return `${(item as any).packSize} ชิ้น/แพ็ค`;
    }

    // ถ้ามี productData และมี packSizeInfo ใน productData
    if (item.productData && (item.productData as any).packSizeInfo) {
      return (item.productData as any).packSizeInfo.displayText;
    }

    // ถ้ามี productData และมี packSize ใน productData
    if (
      item.productData &&
      (item.productData as any).packSize &&
      (item.productData as any).packSize > 1
    ) {
      return `${(item.productData as any).packSize} ชิ้น/แพ็ค`;
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
                <span className="text-fn-green font-medium">{item.brand}</span>
                <span>•</span>
                <span>{item.category}</span>
                {/* แสดงขนาดใน desktop เท่านั้น */}
                {getSizeDisplay() && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:inline font-medium text-blue-600">
                      {getSizeDisplay()}
                    </span>
                  </>
                )}
              </div>
              {/* Size - แสดงในบรรทัดใหม่สำหรับ mobile */}
              {getSizeDisplay() && (
                <div className="sm:hidden text-sm text-blue-600 font-medium mt-1">
                  📦 {getSizeDisplay()}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
            <span>บาร์โค้ด: {item.barcode}</span>
            <span className="hidden sm:inline">
              อัพเดต: {formatDate(item.lastUpdated)}
            </span>
            {/* แสดงวันที่อัพเดตแบบสั้นใน mobile */}
            <span className="sm:hidden">{formatDate(item.lastUpdated)}</span>
          </div>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center gap-2 sm:gap-3 ml-2 sm:ml-4 flex-shrink-0">
          {isEditing ? (
            /* Edit Mode */
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={editQuantity}
                onChange={(e) => onEditQuantityChange(Number(e.target.value))}
                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-fn-green focus:border-transparent"
                min="0"
                autoFocus
              />
              <button
                onClick={onEditSave}
                className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                title="บันทึก"
              >
                <CheckCircle size={16} />
              </button>
              <button
                onClick={onEditCancel}
                className="p-1 text-gray-500 hover:bg-gray-50 rounded transition-colors"
                title="ยกเลิก"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            /* Display Mode */
            <div className="flex items-center gap-2">
              {/* Quick Adjust Buttons */}
              <button
                onClick={() => onQuickAdjust(-1)}
                className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors"
                disabled={item.quantity <= 0}
                title="ลดจำนวน"
              >
                <Minus size={14} />
              </button>

              {/* Quantity Display */}
              <div className="min-w-[50px] sm:min-w-[60px] text-center">
                <div className="text-xl sm:text-2xl font-bold text-gray-900">
                  {item.quantity}
                </div>
                <div className="text-xs text-gray-500">ชิ้น</div>
              </div>

              <button
                onClick={() => onQuickAdjust(1)}
                className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors"
                title="เพิ่มจำนวน"
              >
                <Plus size={14} />
              </button>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 ml-1 sm:ml-2">
                <button
                  onClick={onEditStart}
                  className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="แก้ไขจำนวน"
                >
                  <Edit3 size={14} className="sm:w-4 sm:h-4" />
                </button>
                <button
                  onClick={onRemove}
                  className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="ลบรายการ"
                >
                  <Trash2 size={14} className="sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
