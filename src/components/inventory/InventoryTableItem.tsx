// Path: src/components/inventory/InventoryTableItem.tsx
// New table view component for grouped inventory display

"use client";

import React, { useState } from "react";
import {
  Archive,
  Package2,
  Edit3,
  Trash2,
  CheckCircle,
  X,
  Plus,
  Minus,
} from "lucide-react";
import {
  GroupedInventoryItem,
  InventoryOperationResult,
} from "../../hooks/inventory/types";
import { BarcodeType, BarcodeUtils } from "../../types/product";

interface InventoryTableItemProps {
  groupedItem: GroupedInventoryItem;
  onUpdateQuantity: (
    baseProductId: string,
    barcodeType: BarcodeType,
    newQuantity: number
  ) => InventoryOperationResult;
  onRemoveProduct: (baseProductId: string) => InventoryOperationResult;
  onEditStart?: (baseProductId: string) => void;
}

// ✅ Edit state for the table row
interface EditState {
  isEditing: boolean;
  selectedUnit: BarcodeType | null;
  editValue: number;
  originalValue: number;
}

export const InventoryTableItem: React.FC<InventoryTableItemProps> = ({
  groupedItem,
  onUpdateQuantity,
  onRemoveProduct,
  onEditStart,
}) => {
  const [editState, setEditState] = useState<EditState>({
    isEditing: false,
    selectedUnit: null,
    editValue: 0,
    originalValue: 0,
  });

  // ✅ Start editing specific unit
  const handleEditStart = (unit: BarcodeType) => {
    const currentValue = getCurrentQuantity(unit);

    setEditState({
      isEditing: true,
      selectedUnit: unit,
      editValue: currentValue,
      originalValue: currentValue,
    });

    onEditStart?.(groupedItem.baseProductId);

    console.log(`🔧 Started editing ${unit} for ${groupedItem.baseName}:`, {
      currentValue,
      baseProductId: groupedItem.baseProductId,
    });
  };

  // ✅ Save edit changes
  const handleEditSave = () => {
    if (!editState.selectedUnit) return;

    console.log(`💾 Saving ${editState.selectedUnit} quantity:`, {
      baseProductId: groupedItem.baseProductId,
      newQuantity: editState.editValue,
      oldQuantity: editState.originalValue,
    });

    const result = onUpdateQuantity(
      groupedItem.baseProductId,
      editState.selectedUnit,
      editState.editValue
    );

    if (result.success) {
      // Reset edit state
      setEditState({
        isEditing: false,
        selectedUnit: null,
        editValue: 0,
        originalValue: 0,
      });

      console.log("✅ Edit saved successfully");
    } else {
      console.error("❌ Failed to save edit:", result.error);
    }
  };

  // ✅ Cancel editing
  const handleEditCancel = () => {
    console.log("🚫 Canceling edit");
    setEditState({
      isEditing: false,
      selectedUnit: null,
      editValue: 0,
      originalValue: 0,
    });
  };

  // ✅ Handle remove entire product
  const handleRemove = () => {
    console.log(`🗑️ Removing entire product: ${groupedItem.baseName}`);

    const result = onRemoveProduct(groupedItem.baseProductId);

    if (result.success) {
      console.log("✅ Product removed successfully");
    } else {
      console.error("❌ Failed to remove product:", result.error);
    }
  };

  // ✅ Get current quantity for specific unit
  const getCurrentQuantity = (unit: BarcodeType): number => {
    switch (unit) {
      case BarcodeType.CS:
        return groupedItem.csQuantity;
      case BarcodeType.DSP:
        return groupedItem.dspQuantity;
      case BarcodeType.EA:
        return groupedItem.eaQuantity;
      default:
        return 0;
    }
  };

  // ✅ Check if unit has data
  const hasData = (unit: BarcodeType): boolean => {
    return getCurrentQuantity(unit) > 0;
  };

  // ✅ Get unit record
  const getUnitRecord = (unit: BarcodeType) => {
    switch (unit) {
      case BarcodeType.CS:
        return groupedItem.csRecord;
      case BarcodeType.DSP:
        return groupedItem.dspRecord;
      case BarcodeType.EA:
        return groupedItem.eaRecord;
      default:
        return null;
    }
  };

  // ✅ Render quantity cell
  const renderQuantityCell = (unit: BarcodeType) => {
    const quantity = getCurrentQuantity(unit);
    const hasRecord = !!getUnitRecord(unit);
    const isEditingThis =
      editState.isEditing && editState.selectedUnit === unit;

    if (isEditingThis) {
      // ✅ Edit mode for this cell
      return (
        <div className="flex items-center gap-1">
          <button
            onClick={() =>
              setEditState((prev) => ({
                ...prev,
                editValue: Math.max(0, prev.editValue - 1),
              }))
            }
            className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
          >
            <Minus size={12} />
          </button>

          <input
            type="number"
            value={editState.editValue}
            onChange={(e) =>
              setEditState((prev) => ({
                ...prev,
                editValue: Math.max(0, parseInt(e.target.value) || 0),
              }))
            }
            className="w-16 h-6 text-center text-xs border rounded px-1"
            min="0"
          />

          <button
            onClick={() =>
              setEditState((prev) => ({
                ...prev,
                editValue: prev.editValue + 1,
              }))
            }
            className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
          >
            <Plus size={12} />
          </button>
        </div>
      );
    }

    if (hasRecord && quantity > 0) {
      // ✅ Display quantity with edit button
      return (
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{quantity}</span>
          <button
            onClick={() => handleEditStart(unit)}
            disabled={editState.isEditing}
            className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 disabled:opacity-50"
            title={`แก้ไข ${BarcodeUtils.getUnitLabel(unit)}`}
          >
            <Edit3 size={12} />
          </button>
        </div>
      );
    }

    // ✅ Empty cell
    return <span className="text-gray-400 text-sm">—</span>;
  };

  return (
    <tr className="hover:bg-gray-50 border-b border-gray-200">
      {/* ✅ Product Name Column */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-fn-green/10 rounded-lg flex items-center justify-center">
            <Package2 size={16} className="text-fn-green" />
          </div>
          <div>
            <div className="font-medium text-gray-900 text-sm">
              {groupedItem.baseName}
            </div>
            <div className="text-xs text-gray-500">
              {groupedItem.materialCode} • {groupedItem.brand}
            </div>
            {groupedItem.productGroup && (
              <div className="text-xs text-gray-400">
                {groupedItem.productGroup}
              </div>
            )}
          </div>
        </div>
      </td>

      {/* ✅ CS Column */}
      <td className="px-4 py-3 text-center min-w-[80px]">
        {renderQuantityCell(BarcodeType.CS)}
      </td>

      {/* ✅ DSP Column */}
      <td className="px-4 py-3 text-center min-w-[80px]">
        {renderQuantityCell(BarcodeType.DSP)}
      </td>

      {/* ✅ EA Column */}
      <td className="px-4 py-3 text-center min-w-[80px]">
        {renderQuantityCell(BarcodeType.EA)}
      </td>

      {/* ✅ Actions Column */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {editState.isEditing ? (
            // ✅ Edit mode actions
            <>
              <button
                onClick={handleEditSave}
                className="p-1.5 rounded bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                title="บันทึก"
              >
                <CheckCircle size={14} />
              </button>
              <button
                onClick={handleEditCancel}
                className="p-1.5 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                title="ยกเลิก"
              >
                <X size={14} />
              </button>
            </>
          ) : (
            // ✅ Normal mode actions
            <button
              onClick={handleRemove}
              className="p-1.5 rounded bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
              title="ลบสินค้าทั้งหมด"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};
