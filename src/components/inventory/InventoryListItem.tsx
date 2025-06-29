// Path: src/components/inventory/InventoryListItem.tsx - Fixed Multi-Unit Display Complete
"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Package,
  Edit3,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
  X,
  Archive,
  Package2,
} from "lucide-react";
import { InventoryItem, QuantityDetail } from "../../hooks/inventory/types";

interface InventoryListItemProps {
  item: InventoryItem;
  isEditing: boolean;
  editQuantity: number;
  onEditStart: () => void;
  onEditSave: () => void;
  onEditQuantityDetailSave?: (
    itemId: string,
    quantityDetail: QuantityDetail
  ) => boolean;
  onEditCancel: () => void;
  onEditQuantityChange: (quantity: number) => void;
  onEditQuantityDetailChange?: (quantityDetail: QuantityDetail) => void;
  onQuickAdjust: (delta: number) => void;
  onRemove: () => void;
}

// ✅ Enhanced edit state for multi-unit support
interface EditState {
  simpleQuantity: number; // For single unit editing
  csQuantity: number; // For CS (ลัง)
  dspQuantity: number; // For DSP (แพ็ค)
  eaQuantity: number; // For EA (ชิ้น)
}

// ✅ Unit configuration with proper styling
const UNIT_CONFIG = {
  ea: {
    label: "ชิ้น",
    shortLabel: "EA",
    icon: Package2,
    color: "bg-blue-100 text-blue-700 border-blue-200",
    iconClass: "text-blue-500",
    priority: 1,
  },
  dsp: {
    label: "แพ็ค",
    shortLabel: "DSP",
    icon: Package,
    color: "bg-green-100 text-green-700 border-green-200",
    iconClass: "text-green-500",
    priority: 2,
  },
  cs: {
    label: "ลัง",
    shortLabel: "CS",
    icon: Archive,
    color: "bg-purple-100 text-purple-700 border-purple-200",
    iconClass: "text-purple-500",
    priority: 3,
  },
};

export const InventoryListItem: React.FC<InventoryListItemProps> = ({
  item,
  isEditing,
  editQuantity,
  onEditStart,
  onEditSave,
  onEditQuantityDetailSave,
  onEditCancel,
  onEditQuantityChange,
  onEditQuantityDetailChange,
  onQuickAdjust,
  onRemove,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // ✅ Initialize edit state based on multi-unit quantities
  const [editState, setEditState] = useState<EditState>(() => {
    return {
      simpleQuantity: editQuantity,
      csQuantity: item.quantities?.cs || 0,
      dspQuantity: item.quantities?.dsp || 0,
      eaQuantity: item.quantities?.ea || 0,
    };
  });

  // ✅ Determine which units are active for this item
  const getActiveUnits = (): Array<"cs" | "dsp" | "ea"> => {
    if (!item.quantities) return ["ea"]; // Fallback for legacy items

    return (["cs", "dsp", "ea"] as const).filter(
      (unit) => (item.quantities?.[unit] || 0) > 0
    );
  };

  // ✅ Check if item has multiple units
  const isMultiUnit = getActiveUnits().length > 1;

  // ✅ Get primary unit for display
  const primaryUnit =
    getActiveUnits().sort(
      (a, b) => UNIT_CONFIG[a].priority - UNIT_CONFIG[b].priority
    )[0] || "ea";

  const primaryUnitConfig = UNIT_CONFIG[primaryUnit];
  const activeUnits = getActiveUnits();

  // ✅ Helper function to get total quantity
  const getTotalQuantity = (): number => {
    if (!item.quantities) {
      return item.quantity || 0;
    }
    const { cs = 0, dsp = 0, ea = 0 } = item.quantities;
    return cs + dsp + ea;
  };

  // ✅ Update edit state when editing starts
  useEffect(() => {
    if (isEditing) {
      setEditState({
        simpleQuantity: editQuantity,
        csQuantity: item.quantities?.cs || 0,
        dspQuantity: item.quantities?.dsp || 0,
        eaQuantity: item.quantities?.ea || 0,
      });

      // Focus input after a short delay
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 100);
    }
  }, [isEditing, editQuantity, item.quantities]);

  // ✅ Handle unit quantity changes for multi-unit editing
  const handleUnitQuantityChange = (
    unit: "cs" | "dsp" | "ea",
    newQuantity: number
  ) => {
    const validQuantity = Math.max(0, newQuantity);
    const newEditState = {
      ...editState,
      [`${unit}Quantity`]: validQuantity,
    };
    setEditState(newEditState);

    // Update the quantityDetail for multi-unit items
    if (onEditQuantityDetailChange) {
      const newQuantityDetail: QuantityDetail = {
        cs: newEditState.csQuantity,
        dsp: newEditState.dspQuantity,
        ea: newEditState.eaQuantity,
        isManualEdit: true,
        lastModified: new Date().toISOString(),
      };
      onEditQuantityDetailChange(newQuantityDetail);
    }
  };

  // ✅ Handle save for both single and multi-unit
  const handleSave = () => {
    if (isMultiUnit && onEditQuantityDetailSave) {
      const quantityDetail: QuantityDetail = {
        cs: editState.csQuantity,
        dsp: editState.dspQuantity,
        ea: editState.eaQuantity,
        isManualEdit: true,
        lastModified: new Date().toISOString(),
      };

      const success = onEditQuantityDetailSave(item.id, quantityDetail);
      if (success) {
        onEditSave(); // Call this only after successful save
      }
    } else {
      onEditSave();
    }
  };

  // ✅ FIXED: Complete renderQuantityDisplay function
  const renderQuantityDisplay = () => {
    // Debug logging
    console.log("🔍 renderQuantityDisplay debug:", {
      itemId: item.id,
      materialCode: item.materialCode,
      quantities: item.quantities,
      isMultiUnit,
      activeUnits,
      primaryUnit,
    });

    if (isMultiUnit) {
      // ✅ Show breakdown for multiple units
      return (
        <div className="text-right min-w-0">
          <div className="space-y-1">
            {activeUnits.map((unit) => {
              const config = UNIT_CONFIG[unit];
              const quantity = item.quantities?.[unit] || 0;
              const isPrimary = unit === primaryUnit;

              console.log(`📊 Unit ${unit}:`, {
                quantity,
                config: config.shortLabel,
                isPrimary,
              });

              return (
                <div
                  key={unit}
                  className={`flex items-center justify-end gap-2 ${
                    isPrimary ? "" : "opacity-75"
                  }`}
                >
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${config.color}`}
                  >
                    {config.shortLabel}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`font-bold ${
                        isPrimary ? "text-gray-900" : "text-gray-600"
                      }`}
                    >
                      {quantity.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500">
                      {config.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total quantity for multi-unit items */}
          <div className="mt-1 pt-1 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              รวม {getTotalQuantity().toLocaleString()} ชิ้น
            </div>
          </div>
        </div>
      );
    } else {
      // ✅ Single unit display - Fixed complete implementation
      const quantity = item.quantities?.[primaryUnit] || item.quantity || 0;
      const config = primaryUnitConfig;

      console.log(`📊 Single unit ${primaryUnit}:`, {
        quantity,
        config: config.shortLabel,
      });

      return (
        <div className="text-right">
          <div className="flex items-center justify-end gap-2">
            <span
              className={`text-xs px-1.5 py-0.5 rounded font-medium ${config.color}`}
            >
              {config.shortLabel}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-bold text-gray-900">
                {quantity.toLocaleString()}
              </span>
              <span className="text-xs text-gray-500">{config.label}</span>
            </div>
          </div>
        </div>
      );
    }
  };

  // ✅ Enhanced editing interface for multi-unit
  const renderEditingInterface = () => {
    if (isMultiUnit) {
      return (
        <div className="space-y-3">
          {activeUnits.map((unit) => {
            const config = UNIT_CONFIG[unit];
            const quantity = editState[
              (unit + "Quantity") as keyof EditState
            ] as number;

            return (
              <div key={unit} className="flex items-center gap-2">
                <span
                  className={`text-xs px-2 py-1 rounded font-medium flex-shrink-0 ${config.color}`}
                >
                  {config.shortLabel}
                </span>

                <div className="flex items-center gap-1 flex-1">
                  <button
                    type="button"
                    onClick={() => handleUnitQuantityChange(unit, quantity - 1)}
                    className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    disabled={quantity <= 0}
                  >
                    <Minus size={14} />
                  </button>

                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) =>
                      handleUnitQuantityChange(
                        unit,
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="w-16 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />

                  <button
                    type="button"
                    onClick={() => handleUnitQuantityChange(unit, quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-50"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            );
          })}

          <div className="flex gap-2 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 flex items-center justify-center gap-1"
            >
              <CheckCircle size={14} />
              บันทึก
            </button>
            <button
              type="button"
              onClick={onEditCancel}
              className="flex-1 px-3 py-2 bg-gray-500 text-white text-sm font-medium rounded hover:bg-gray-600 flex items-center justify-center gap-1"
            >
              <X size={14} />
              ยกเลิก
            </button>
          </div>
        </div>
      );
    } else {
      // Simple single unit editing
      return (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 flex-1">
            <button
              type="button"
              onClick={() => onQuickAdjust(-1)}
              className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-50"
            >
              <Minus size={14} />
            </button>

            <input
              ref={inputRef}
              type="number"
              value={editState.simpleQuantity}
              onChange={(e) => {
                const newValue = parseInt(e.target.value) || 0;
                setEditState({ ...editState, simpleQuantity: newValue });
                onEditQuantityChange(newValue);
              }}
              className="flex-1 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
            />

            <button
              type="button"
              onClick={() => onQuickAdjust(1)}
              className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-50"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="flex gap-1">
            <button
              type="button"
              onClick={onEditSave}
              className="px-3 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700"
            >
              <CheckCircle size={14} />
            </button>
            <button
              type="button"
              onClick={onEditCancel}
              className="px-3 py-2 bg-gray-500 text-white text-sm font-medium rounded hover:bg-gray-600"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Product Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`p-2 rounded-lg ${primaryUnitConfig.color}`}>
          <primaryUnitConfig.icon size={20} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">
            {item.productName}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-gray-600">{item.brand}</span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500">{item.size}</span>
          </div>

          {/* Material Code */}
          <div className="text-xs text-gray-500 mt-1">
            รหัส: {item.materialCode || item.barcode}
          </div>
        </div>

        {/* Quantity Display */}
        <div className="text-right">
          {!isEditing && renderQuantityDisplay()}
        </div>
      </div>

      {/* ✅ Actions: Edit and Delete only */}
      {isEditing ? (
        <div className="mt-3 pt-3 border-t border-gray-200">
          {renderEditingInterface()}
        </div>
      ) : (
        <div className="flex items-center justify-end mt-3 pt-3 border-t border-gray-200">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onEditStart}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
              title="แก้ไขจำนวน"
            >
              <Edit3 size={16} />
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
              title="ลบรายการ"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
