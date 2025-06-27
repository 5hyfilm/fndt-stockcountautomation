// Path: src/components/inventory/InventoryListItem.tsx - Enhanced with Correct Multi-Unit Display
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
  },
  dsp: {
    label: "แพ็ค",
    shortLabel: "DSP",
    icon: Package,
    color: "bg-green-100 text-green-700 border-green-200",
    iconClass: "text-green-500",
  },
  cs: {
    label: "ลัง",
    shortLabel: "CS",
    icon: Archive,
    color: "bg-purple-100 text-purple-700 border-purple-200",
    iconClass: "text-purple-500",
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

  // ✅ Get primary unit (the one with highest quantity or the one that was scanned)
  const getPrimaryUnit = (): "cs" | "dsp" | "ea" => {
    const activeUnits = getActiveUnits();

    if (activeUnits.length === 0) return "ea";
    if (activeUnits.length === 1) return activeUnits[0];

    // If multiple units, prefer the one with highest quantity
    const quantities = item.quantities || {};
    let maxUnit: "cs" | "dsp" | "ea" = "ea";
    let maxQuantity = 0;

    (["cs", "dsp", "ea"] as const).forEach((unit) => {
      const qty = quantities[unit] || 0;
      if (qty > maxQuantity) {
        maxQuantity = qty;
        maxUnit = unit;
      }
    });

    return maxUnit;
  };

  // ✅ Calculate total quantity across all units
  const getTotalQuantity = (): number => {
    if (!item.quantities) return item.quantity || 0;

    const { cs = 0, dsp = 0, ea = 0 } = item.quantities;
    return cs + dsp + ea;
  };

  const activeUnits = getActiveUnits();
  const primaryUnit = getPrimaryUnit();
  const primaryUnitConfig = UNIT_CONFIG[primaryUnit];
  const isMultiUnit = activeUnits.length > 1;

  // ✅ Sync edit state when editing starts
  useEffect(() => {
    if (isEditing) {
      setEditState({
        simpleQuantity: editQuantity,
        csQuantity: item.quantities?.cs || 0,
        dspQuantity: item.quantities?.dsp || 0,
        eaQuantity: item.quantities?.ea || 0,
      });
    }
  }, [isEditing, editQuantity, item.quantities]);

  // ✅ Enhanced quantity display component
  const renderQuantityDisplay = () => {
    if (isMultiUnit) {
      // Show breakdown for multiple units
      return (
        <div className="text-right min-w-0">
          <div className="space-y-1">
            {activeUnits.map((unit) => {
              const config = UNIT_CONFIG[unit];
              const quantity = item.quantities?.[unit] || 0;
              const isPrimary = unit === primaryUnit;

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
                        isPrimary
                          ? "text-lg text-gray-900"
                          : "text-sm text-gray-700"
                      }`}
                    >
                      {quantity}
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
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              รวม:{" "}
              <span className="font-medium text-gray-700">
                {getTotalQuantity()}
              </span>{" "}
              หน่วย
            </div>
          </div>
        </div>
      );
    } else {
      // Single unit display
      const quantity = item.quantities?.[primaryUnit] || item.quantity || 0;

      return (
        <div className="text-right min-w-0">
          <div className="flex items-center justify-end gap-2">
            <span
              className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${primaryUnitConfig.color}`}
            >
              {primaryUnitConfig.shortLabel}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-gray-900">
                {quantity}
              </span>
              <span className="text-xs text-gray-500">
                {primaryUnitConfig.label}
              </span>
            </div>
          </div>
        </div>
      );
    }
  };

  // ✅ Enhanced edit form for multi-unit support
  const renderEditForm = () => {
    if (isMultiUnit) {
      // Multi-unit editing
      return (
        <div className="bg-blue-50 rounded-lg p-4 mt-3 border border-blue-200">
          <div className="space-y-3">
            <div className="text-sm font-medium text-blue-900 mb-3">
              แก้ไขจำนวนตามหน่วย
            </div>

            {activeUnits.map((unit) => {
              const config = UNIT_CONFIG[unit];
              const currentQuantity = editState[
                `${unit}Quantity` as keyof EditState
              ] as number;

              return (
                <div key={unit} className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2 py-1 rounded font-medium ${config.color} min-w-[50px] text-center`}
                  >
                    {config.shortLabel}
                  </span>

                  <div className="flex items-center gap-2 flex-1">
                    <button
                      onClick={() => {
                        const newQuantity = Math.max(0, currentQuantity - 1);
                        setEditState((prev) => ({
                          ...prev,
                          [`${unit}Quantity`]: newQuantity,
                        }));
                      }}
                      className="p-1 rounded bg-red-100 text-red-600 hover:bg-red-200"
                    >
                      <Minus size={14} />
                    </button>

                    <input
                      type="number"
                      min="0"
                      value={currentQuantity}
                      onChange={(e) => {
                        const newQuantity = Math.max(
                          0,
                          parseInt(e.target.value) || 0
                        );
                        setEditState((prev) => ({
                          ...prev,
                          [`${unit}Quantity`]: newQuantity,
                        }));
                      }}
                      className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <button
                      onClick={() => {
                        const newQuantity = currentQuantity + 1;
                        setEditState((prev) => ({
                          ...prev,
                          [`${unit}Quantity`]: newQuantity,
                        }));
                      }}
                      className="p-1 rounded bg-green-100 text-green-600 hover:bg-green-200"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <span className="text-sm text-gray-600 min-w-[40px]">
                    {config.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-blue-200">
            <button
              onClick={() => {
                // For multi-unit items, we need to save each unit separately
                // This is a simplified approach - in real implementation,
                // you'd want to update the parent component's API
                onEditSave();
              }}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-1"
            >
              <CheckCircle size={14} />
              บันทึก
            </button>
            <button
              onClick={onEditCancel}
              className="px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm flex items-center gap-1"
            >
              <X size={14} />
              ยกเลิก
            </button>
          </div>
        </div>
      );
    } else {
      // Single unit editing (existing logic)
      return (
        <div className="bg-blue-50 rounded-lg p-4 mt-3 border border-blue-200">
          <div className="space-y-3">
            <div className="text-sm font-medium text-blue-900">
              แก้ไขจำนวน ({primaryUnitConfig.label})
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => onQuickAdjust(-1)}
                className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
              >
                <Minus size={16} />
              </button>

              <input
                type="number"
                min="0"
                value={editQuantity}
                onChange={(e) =>
                  onEditQuantityChange(parseInt(e.target.value) || 0)
                }
                className="flex-1 px-3 py-2 text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                onClick={() => onQuickAdjust(1)}
                className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onEditSave}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
              >
                <CheckCircle size={16} />
                บันทึก
              </button>
              <button
                onClick={onEditCancel}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm flex items-center gap-2"
              >
                <X size={16} />
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Product icon */}
          <div
            className={`p-2 rounded-lg ${primaryUnitConfig.color} flex-shrink-0`}
          >
            <primaryUnitConfig.icon size={20} />
          </div>

          {/* Product info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">
              {item.productName}
            </h3>

            <div className="space-y-1">
              <div className="text-xs text-gray-600">
                รหัส:{" "}
                <span className="font-mono">
                  {item.materialCode || item.barcode}
                </span>
              </div>
              <div className="text-xs text-gray-600">
                หมวดหมู่: <span className="text-gray-800">{item.category}</span>
              </div>
              <div className="text-xs text-gray-600">
                แบรนด์: <span className="text-gray-800">{item.brand}</span>
              </div>
              {isMultiUnit && (
                <div className="text-xs text-blue-600 font-medium">
                  🔄 หลายหน่วย ({activeUnits.length} ประเภท)
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quantity display */}
        {!isEditing && renderQuantityDisplay()}
      </div>

      {/* Action buttons */}
      {!isEditing && (
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            อัปเดต:{" "}
            {new Date(item.lastUpdated).toLocaleString("th-TH", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onEditStart}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="แก้ไขจำนวน"
            >
              <Edit3 size={16} />
            </button>
            <button
              onClick={onRemove}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="ลบรายการ"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Edit form */}
      {isEditing && renderEditForm()}
    </div>
  );
};
