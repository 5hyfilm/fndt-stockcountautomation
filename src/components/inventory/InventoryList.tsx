// src/components/inventory/InventoryList.tsx - Updated with Dual Unit Support
"use client";

import React from "react";
import { Archive } from "lucide-react";
import { InventoryItem } from "../../hooks/useInventoryManager";
import { InventoryListItem } from "./InventoryListItem";

interface InventoryListProps {
  items: InventoryItem[];
  totalCount: number;
  editingItem: string | null;
  editQuantity: number;
  onEditStart: (item: InventoryItem) => void;
  onEditSave: (itemId: string) => void;
  onEditCancel: () => void;
  onEditQuantityChange: (quantity: number) => void;
  onQuickAdjust: (
    itemId: string,
    currentQuantity: number,
    delta: number
  ) => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateDualUnit?: (
    itemId: string,
    csCount: number,
    pieceCount: number
  ) => void; // ✅ NEW
}

export const InventoryList: React.FC<InventoryListProps> = ({
  items,
  totalCount,
  editingItem,
  editQuantity,
  onEditStart,
  onEditSave,
  onEditCancel,
  onEditQuantityChange,
  onQuickAdjust,
  onRemoveItem,
  onUpdateDualUnit, // ✅ NEW
}) => {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Archive className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 text-lg mb-2">
            {totalCount === 0
              ? "ยังไม่มีสินค้าใน inventory"
              : "ไม่พบสินค้าที่ตรงกับเงื่อนไข"}
          </p>
          <p className="text-gray-500 text-sm">
            {totalCount === 0
              ? "เริ่มสแกนบาร์โค้ดเพื่อเพิ่มสินค้า"
              : "ลองเปลี่ยนคำค้นหาหรือfilter"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="divide-y divide-gray-200">
        {items.map((item) => (
          <InventoryListItem
            key={item.id}
            item={item}
            isEditing={editingItem === item.id}
            editQuantity={editQuantity}
            onEditStart={() => onEditStart(item)}
            onEditSave={() => onEditSave(item.id)}
            onEditCancel={onEditCancel}
            onEditQuantityChange={onEditQuantityChange}
            onQuickAdjust={(delta) =>
              onQuickAdjust(item.id, item.quantity, delta)
            }
            onRemove={() => onRemoveItem(item.id)}
            onUpdateDualUnit={
              onUpdateDualUnit
                ? (csCount, pieceCount) =>
                    onUpdateDualUnit(item.id, csCount, pieceCount)
                : undefined
            } // ✅ Pass dual unit handler
          />
        ))}
      </div>
    </div>
  );
};
