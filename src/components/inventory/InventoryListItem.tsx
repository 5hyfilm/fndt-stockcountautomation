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

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-fn-green/10 p-2 rounded-lg">
              <Package className="fn-green" size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">
                {item.productName}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="fn-green font-medium">{item.brand}</span>
                <span>•</span>
                <span>{item.category}</span>
                <span>•</span>
                <span>
                  {item.size} {item.unit}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>บาร์โค้ด: {item.barcode}</span>
            <span>อัพเดต: {formatDate(item.lastUpdated)}</span>
          </div>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center gap-3 ml-4">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={editQuantity}
                onChange={(e) =>
                  onEditQuantityChange(parseInt(e.target.value) || 0)
                }
                min="0"
                max="9999"
                className="w-16 text-center py-1 border border-gray-300 rounded"
              />
              <button
                onClick={onEditSave}
                className="text-green-600 hover:text-green-700 p-1"
              >
                <CheckCircle size={16} />
              </button>
              <button
                onClick={onEditCancel}
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onQuickAdjust(-1)}
                  disabled={item.quantity <= 0}
                  className="bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 p-1 rounded"
                >
                  <Minus size={14} />
                </button>

                <div className="min-w-[60px] text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {item.quantity}
                  </div>
                  <div className="text-xs text-gray-500">{"ชิ้น"}</div>
                </div>

                <button
                  onClick={() => onQuickAdjust(1)}
                  className="bg-gray-100 hover:bg-gray-200 p-1 rounded"
                >
                  <Plus size={14} />
                </button>
              </div>

              <button
                onClick={onEditStart}
                className="text-blue-600 hover:text-blue-700 p-1"
                title="แก้ไขจำนวน"
              >
                <Edit3 size={16} />
              </button>

              <button
                onClick={onRemove}
                className="text-red-600 hover:text-red-700 p-1"
                title="ลบรายการ"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
