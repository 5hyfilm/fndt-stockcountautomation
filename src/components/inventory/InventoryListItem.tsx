// Path: src/components/inventory/InventoryListItem.tsx - Fixed Display Name
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
  Clock,
} from "lucide-react";
import { InventoryItem, QuantityDetail } from "../../hooks/inventory/types";

interface InventoryListItemProps {
  item: InventoryItem;
  isEditing: boolean;
  editQuantity: number;
  onEditStart: () => void;
  onEditSave: () => void;
  onEditQuantityDetailSave?: (
    materialCode: string,
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

// ✅ Helper function to check if item is new product
const isNewProduct = (item: InventoryItem): boolean => {
  return (
    !item.materialCode ||
    item.materialCode.trim() === "" ||
    item.materialCode.startsWith("NEW_") ||
    item.materialCode.startsWith("new_") ||
    item.brand === "เพิ่มใหม่" ||
    item.brand === "สินค้าใหม่" ||
    item.productName?.startsWith("FG")
  );
};

// ✅ Helper function to get product display name - แก้ไขปัญหาการแสดงชื่อสินค้า
const getProductDisplayName = (item: InventoryItem): string => {
  if (isNewProduct(item)) {
    // สำหรับสินค้าใหม่: ใช้ description จาก productData หรือ thaiDescription
    return (
      item.productData?.description ||
      item.thaiDescription ||
      item.productName ||
      "สินค้าไม่ระบุชื่อ"
    );
  } else {
    // สำหรับสินค้าเก่า: ใช้ thaiDescription หรือ productName
    return item.thaiDescription || item.productName || "สินค้าไม่ระบุชื่อ";
  }
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

  const activeUnits = getActiveUnits();
  const isMultiUnit = activeUnits.length > 1;

  // Determine primary unit (highest priority unit with quantity > 0)
  const primaryUnit = activeUnits.reduce((highest, current) => {
    return UNIT_CONFIG[current].priority > UNIT_CONFIG[highest].priority
      ? current
      : highest;
  }, activeUnits[0] || "ea");

  const primaryUnitConfig = UNIT_CONFIG[primaryUnit];

  // ✅ Sync edit state when item changes
  useEffect(() => {
    setEditState({
      simpleQuantity: editQuantity,
      csQuantity: item.quantities?.cs || 0,
      dspQuantity: item.quantities?.dsp || 0,
      eaQuantity: item.quantities?.ea || 0,
    });
  }, [editQuantity, item.quantities]);

  // ✅ Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // ✅ Handle unit quantity change
  const handleUnitQuantityChange = (
    unit: "cs" | "dsp" | "ea",
    value: number
  ) => {
    const newQuantity = Math.max(0, value);
    setEditState((prev) => ({
      ...prev,
      [`${unit}Quantity`]: newQuantity,
    }));

    // Update parent component if callback exists
    if (onEditQuantityDetailChange) {
      const quantityDetail: QuantityDetail = {
        cs: unit === "cs" ? newQuantity : editState.csQuantity,
        dsp: unit === "dsp" ? newQuantity : editState.dspQuantity,
        ea: unit === "ea" ? newQuantity : editState.eaQuantity,
        scannedType: unit,
        isManualEdit: true,
        lastModified: new Date().toISOString(),
      };
      onEditQuantityDetailChange(quantityDetail);
    }
  };

  // ✅ Handle save with quantity detail support
  const handleSave = () => {
    if (onEditQuantityDetailSave && isMultiUnit) {
      const quantityDetail: QuantityDetail = {
        cs: editState.csQuantity,
        dsp: editState.dspQuantity,
        ea: editState.eaQuantity,
        isManualEdit: true,
        lastModified: new Date().toISOString(),
      };

      const success = onEditQuantityDetailSave(
        item.materialCode || item.id,
        quantityDetail
      );
      if (success) {
        onEditSave();
      }
    } else {
      onEditSave();
    }
  };

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
                        isPrimary ? "text-gray-900" : "text-gray-600"
                      }`}
                    >
                      {quantity.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    } else {
      // Single unit display
      const quantity = item.quantities?.[primaryUnit] || item.quantity || 0;
      return (
        <div className="text-right">
          <div className="flex items-center justify-end gap-2">
            <span
              className={`text-xs px-1.5 py-0.5 rounded font-medium ${primaryUnitConfig.color}`}
            >
              {primaryUnitConfig.shortLabel}
            </span>
            <span className="font-bold text-gray-900">
              {quantity.toLocaleString()}
            </span>
          </div>
        </div>
      );
    }
  };

  // ✅ Enhanced editing interface for multiple units
  const renderEditingInterface = () => {
    if (isMultiUnit) {
      return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-3">
          <div className="text-sm font-medium text-gray-700 mb-2">
            แก้ไขจำนวนตามหน่วย
          </div>

          {activeUnits.map((unit) => {
            const config = UNIT_CONFIG[unit];
            const currentQuantity = editState[
              `${unit}Quantity` as keyof EditState
            ] as number;

            return (
              <div key={unit} className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${config.color}`}>
                  <config.icon size={16} />
                </div>

                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700">
                    {config.label} ({config.shortLabel})
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      handleUnitQuantityChange(unit, currentQuantity - 1)
                    }
                    className="p-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-600"
                  >
                    <Minus size={14} />
                  </button>

                  <input
                    type="number"
                    value={currentQuantity}
                    onChange={(e) =>
                      handleUnitQuantityChange(
                        unit,
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="w-16 px-2 py-1 text-center border border-gray-300 rounded"
                    min="0"
                  />

                  <button
                    onClick={() =>
                      handleUnitQuantityChange(unit, currentQuantity + 1)
                    }
                    className="p-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-600"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Save/Cancel Buttons */}
          <div className="flex gap-2 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={handleSave}
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
    } else {
      // Simple quantity editing for single unit
      return (
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => onQuickAdjust(-1)}
            className="p-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-600"
          >
            <Minus size={14} />
          </button>

          <input
            ref={inputRef}
            type="number"
            value={editQuantity}
            onChange={(e) =>
              onEditQuantityChange(parseInt(e.target.value) || 0)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") onEditSave();
              if (e.key === "Escape") onEditCancel();
            }}
            className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            min="0"
          />

          <button
            onClick={() => onQuickAdjust(1)}
            className="p-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-600"
          >
            <Plus size={14} />
          </button>

          <div className="flex gap-2 ml-2">
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
          {/* ✅ แก้ไข: ใช้ getProductDisplayName แทน item.productName */}
          <h3 className="font-medium text-gray-900 truncate">
            {getProductDisplayName(item)}
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

      {/* Editing Interface or Actions */}
      {isEditing ? (
        renderEditingInterface()
      ) : (
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          {/* Last Updated Info */}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock size={12} />
            <span>
              {new Date(item.lastUpdated).toLocaleDateString("th-TH", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onEditStart}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="แก้ไขจำนวน"
            >
              <Edit3 size={16} />
            </button>

            <button
              onClick={onRemove}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
