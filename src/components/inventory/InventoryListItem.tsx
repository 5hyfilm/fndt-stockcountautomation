// Path: src/components/inventory/InventoryListItem.tsx - เพิ่มเวลาที่แก้ไขล่าสุด
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
  Calendar,
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
  onUpdateUnitQuantity?: (
    unit: "cs" | "dsp" | "ea",
    newQuantity: number
  ) => void;
}

// ✅ Enhanced edit state for consistent multi-unit support
interface EditState {
  csQuantity: number;
  dspQuantity: number;
  eaQuantity: number;
}

// ✅ Consistent unit configuration with proper styling
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

// ✅ Helper function to format timestamp
const formatTimestamp = (timestamp: string): string => {
  try {
    const time = new Date(timestamp);
    if (isNaN(time.getTime())) {
      return "เวลาไม่ถูกต้อง";
    }

    return time.toLocaleString("th-TH", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.error("Error formatting timestamp:", error);
    return "เวลาไม่ถูกต้อง";
  }
};

export const InventoryListItem: React.FC<InventoryListItemProps> = ({
  item,
  isEditing,
  onEditStart,
  onEditSave,
  onEditQuantityDetailSave,
  onEditCancel,
  onEditQuantityDetailChange,
  onRemove,
  onUpdateUnitQuantity,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // ✅ Initialize edit state based on all possible units
  const [editState, setEditState] = useState<EditState>(() => {
    return {
      csQuantity: item.quantities?.cs || 0,
      dspQuantity: item.quantities?.dsp || 0,
      eaQuantity: item.quantities?.ea || 0,
    };
  });

  // ✅ CHANGED: แสดงทั้ง 3 หน่วยเสมอ
  const getAllUnits = (): Array<"cs" | "dsp" | "ea"> => {
    return ["cs", "dsp", "ea"]; // แสดงทั้ง 3 หน่วยเสมอ
  };

  // ✅ เช็คหน่วยที่มีจำนวน > 0 สำหรับการคำนวณ
  const getActiveUnits = (): Array<"cs" | "dsp" | "ea"> => {
    return (["cs", "dsp", "ea"] as const).filter(
      (unit) => (item.quantities?.[unit] || 0) > 0
    );
  };

  const allUnits = getAllUnits();
  const activeUnits = getActiveUnits();

  // ✅ Get primary unit for header display
  const getPrimaryUnit = (): "cs" | "dsp" | "ea" => {
    if (activeUnits.length === 0) return "ea"; // Default
    return activeUnits.sort(
      (a, b) => UNIT_CONFIG[a].priority - UNIT_CONFIG[b].priority
    )[0];
  };

  const primaryUnit = getPrimaryUnit();
  const primaryUnitConfig = UNIT_CONFIG[primaryUnit];

  // ✅ Update edit state when item changes
  useEffect(() => {
    setEditState({
      csQuantity: item.quantities?.cs || 0,
      dspQuantity: item.quantities?.dsp || 0,
      eaQuantity: item.quantities?.ea || 0,
    });
  }, [item.quantities]);

  // ✅ Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  // ✅ Handle unit quantity change
  const handleUnitQuantityChange = (
    unit: "cs" | "dsp" | "ea",
    newQuantity: number
  ) => {
    if (newQuantity < 0) return;

    const updatedState = {
      ...editState,
      [unit + "Quantity"]: newQuantity,
    };
    setEditState(updatedState);

    // Call the parent handler if available
    if (onUpdateUnitQuantity) {
      onUpdateUnitQuantity(unit, newQuantity);
    }

    // Update quantity detail for all items (since we always show 3 units)
    if (onEditQuantityDetailChange) {
      const quantityDetail: QuantityDetail = {
        cs: updatedState.csQuantity,
        dsp: updatedState.dspQuantity,
        ea: updatedState.eaQuantity,
        isManualEdit: true,
        lastModified: new Date().toISOString(),
      };
      onEditQuantityDetailChange(quantityDetail);
    }
  };

  // ✅ Handle save action
  const handleSave = () => {
    if (onEditQuantityDetailSave) {
      const quantityDetail: QuantityDetail = {
        cs: editState.csQuantity,
        dsp: editState.dspQuantity,
        ea: editState.eaQuantity,
        isManualEdit: true,
        lastModified: new Date().toISOString(),
      };
      onEditQuantityDetailSave(item.materialCode || item.id, quantityDetail);
    } else {
      onEditSave();
    }
  };

  // ✅ NEW: Render timestamp display
  const renderTimestamp = () => {
    const lastUpdated = item.quantityDetail?.lastModified || item.lastUpdated;

    if (!lastUpdated) {
      return null;
    }

    const formattedTime = formatTimestamp(lastUpdated);

    return (
      <div className="flex items-center gap-1 text-xs mt-1 text-gray-500">
        <Clock size={12} className="text-gray-400" />
        <span>{formattedTime}</span>
      </div>
    );
  };

  // ✅ CHANGED: แสดงทั้ง 3 หน่วยเสมอ
  const renderQuantityDisplay = () => {
    return (
      <div className="text-right min-w-0">
        {/* แสดงทั้ง 3 หน่วยในบรรทัดเดียว */}
        <div className="flex items-center gap-1 justify-end flex-wrap mb-2">
          {allUnits.map((unit) => {
            const config = UNIT_CONFIG[unit];
            const quantity = item.quantities?.[unit] || 0;
            const hasQuantity = quantity > 0;

            return (
              <div key={unit} className="flex items-center gap-1">
                <span
                  className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                    hasQuantity
                      ? config.color
                      : "bg-gray-100 text-gray-400 border-gray-200"
                  }`}
                >
                  {config.shortLabel}
                </span>
                <span
                  className={`text-sm font-bold ${
                    hasQuantity ? "text-gray-900" : "text-gray-400"
                  }`}
                >
                  {quantity}
                </span>
                {unit !== "ea" && (
                  <span className="text-gray-300 text-sm">|</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ✅ CHANGED: แก้ไขทั้ง 3 หน่วยเสมอ
  const renderEditingInterface = () => {
    return (
      <div className="space-y-3">
        <div className="text-sm font-medium text-gray-700 mb-2">
          แก้ไขจำนวนสินค้า (ทั้ง 3 หน่วย)
        </div>

        {allUnits.map((unit) => {
          const config = UNIT_CONFIG[unit];
          const quantity = editState[
            (unit + "Quantity") as keyof EditState
          ] as number;
          const Icon = config.icon;

          return (
            <div
              key={unit}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              {/* Unit Badge with Icon */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className={`p-2 rounded-lg ${config.color}`}>
                  <Icon size={16} />
                </div>
                <span
                  className={`text-sm font-medium px-3 py-1 rounded-full ${config.color}`}
                >
                  {config.shortLabel}
                </span>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-2 flex-1">
                <button
                  type="button"
                  onClick={() => handleUnitQuantityChange(unit, quantity - 1)}
                  className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  disabled={quantity <= 0}
                >
                  <Minus size={14} />
                </button>

                <input
                  ref={unit === "cs" ? inputRef : undefined} // Focus first unit (CS)
                  type="number"
                  value={quantity}
                  onChange={(e) =>
                    handleUnitQuantityChange(
                      unit,
                      parseInt(e.target.value) || 0
                    )
                  }
                  className="w-20 px-3 py-2 text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                  min="0"
                />

                <button
                  type="button"
                  onClick={() => handleUnitQuantityChange(unit, quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <Plus size={14} />
                </button>

                <span className="text-sm text-gray-600 ml-2">
                  {config.label}
                </span>
              </div>
            </div>
          );
        })}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-3 border-t border-gray-200">
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 transition-colors"
          >
            <CheckCircle size={16} />
            บันทึก
          </button>
          <button
            type="button"
            onClick={onEditCancel}
            className="flex-1 px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-lg hover:bg-gray-600 flex items-center justify-center gap-2 transition-colors"
          >
            <X size={16} />
            ยกเลิก
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Product Header */}
      <div className="flex items-start gap-3 mb-3">
        {/* Product Icon with Primary Unit Color */}
        <div className={`p-3 rounded-lg ${primaryUnitConfig.color}`}>
          <primaryUnitConfig.icon size={24} />
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate text-lg">
            {item.productName}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-gray-600 font-medium">
              {item.brand}
            </span>
            {item.size && (
              <>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500">{item.size}</span>
              </>
            )}
          </div>

          {/* Material Code */}
          <div className="text-xs text-gray-500 mt-1 font-mono">
            รหัส: {item.materialCode || item.barcode}
          </div>

          {/* ✅ NEW: Timestamp Display */}
          {renderTimestamp()}
        </div>

        {/* Quantity Display */}
        <div className="text-right">
          {!isEditing && renderQuantityDisplay()}
        </div>
      </div>

      {/* Actions */}
      {isEditing ? (
        <div className="mt-4 pt-4 border-t border-gray-200">
          {renderEditingInterface()}
        </div>
      ) : (
        <div className="flex items-center justify-end mt-3 pt-3 border-t border-gray-200">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onEditStart}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="แก้ไขจำนวน"
            >
              <Edit3 size={16} />
              <span className="text-sm font-medium">แก้ไข</span>
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="ลบรายการ"
            >
              <Trash2 size={16} />
              <span className="text-sm font-medium">ลบ</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
