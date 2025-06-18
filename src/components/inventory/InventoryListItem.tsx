// src/components/inventory/InventoryListItem.tsx - Phase 2: Enhanced Display
"use client";

import React, { useState } from "react";
import {
  Package,
  Edit3,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
  X,
  Archive,
  Hash,
  Package2,
} from "lucide-react";
import {
  InventoryItem,
  QuantityDetail,
  getQuantityDisplayText,
} from "../../hooks/inventory/types";

interface InventoryListItemProps {
  item: InventoryItem;
  isEditing: boolean;
  editQuantity: number;
  onEditStart: () => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onEditQuantityChange: (quantity: number) => void;
  onEditQuantityDetailChange?: (quantityDetail: QuantityDetail) => void; // ✅ New prop
  onQuickAdjust: (delta: number) => void;
  onRemove: () => void;
}

// ✅ Enhanced edit state for quantity details
interface EditState {
  mode: "simple" | "detailed";
  simpleQuantity: number;
  majorQuantity: number;
  remainderQuantity: number;
}

// ✅ Unit configuration
const UNIT_CONFIG = {
  ea: {
    label: "ชิ้น",
    shortLabel: "EA",
    icon: Package2,
    color: "bg-blue-100 text-blue-700",
  },
  dsp: {
    label: "แพ็ค",
    shortLabel: "DSP",
    icon: Package,
    color: "bg-green-100 text-green-700",
  },
  cs: {
    label: "ลัง",
    shortLabel: "CS",
    icon: Archive,
    color: "bg-purple-100 text-purple-700",
  },
};

export const InventoryListItem: React.FC<InventoryListItemProps> = ({
  item,
  isEditing,
  editQuantity,
  onEditStart,
  onEditSave,
  onEditCancel,
  onEditQuantityChange,
  onEditQuantityDetailChange,
  onQuickAdjust,
  onRemove,
}) => {
  // ✅ Local edit state for detailed quantity editing
  const [editState, setEditState] = useState<EditState>({
    mode: item.quantityDetail ? "detailed" : "simple",
    simpleQuantity: editQuantity,
    majorQuantity: item.quantityDetail?.major || editQuantity,
    remainderQuantity: item.quantityDetail?.remainder || 0,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ✅ Get barcode type configuration
  const barcodeType = item.barcodeType || "ea";
  const unitConfig = UNIT_CONFIG[barcodeType];

  // ✅ Handle edit mode switching
  const handleEditModeChange = (mode: "simple" | "detailed") => {
    setEditState((prev) => ({ ...prev, mode }));
  };

  // ✅ Handle edit quantity changes
  const handleEditQuantityChange = (field: keyof EditState, value: number) => {
    setEditState((prev) => {
      const newState = { ...prev, [field]: Math.max(0, value) };

      // Auto-update the legacy editQuantity for backward compatibility
      if (field === "simpleQuantity") {
        onEditQuantityChange(value);
      } else if (field === "majorQuantity") {
        onEditQuantityChange(value);
      }

      return newState;
    });
  };

  // ✅ Handle save with appropriate format
  const handleSave = () => {
    if (editState.mode === "detailed" && onEditQuantityDetailChange) {
      const quantityDetail: QuantityDetail = {
        major: editState.majorQuantity,
        remainder: editState.remainderQuantity,
        scannedType: barcodeType,
      };
      onEditQuantityDetailChange(quantityDetail);
    } else {
      onEditQuantityChange(editState.simpleQuantity);
    }
    onEditSave();
  };

  // ✅ Render quantity display based on item data
  const renderQuantityDisplay = () => {
    if (item.quantityDetail) {
      const { major, remainder, scannedType } = item.quantityDetail;
      const config = UNIT_CONFIG[scannedType];

      return (
        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2 py-1 rounded ${config.color} font-medium`}
          >
            {config.shortLabel}
          </span>
          <div className="flex items-center gap-1">
            <span className="font-semibold text-lg">{major}</span>
            <span className="text-sm text-gray-600">{config.label}</span>
            {remainder > 0 && (
              <>
                <span className="text-gray-400 mx-1">+</span>
                <span className="font-medium">{remainder}</span>
                <span className="text-sm text-gray-600">ชิ้น</span>
              </>
            )}
          </div>
        </div>
      );
    }

    // ✅ Fallback to simple quantity display
    return (
      <div className="flex items-center gap-2">
        <span
          className={`text-xs px-2 py-1 rounded ${unitConfig.color} font-medium`}
        >
          {unitConfig.shortLabel}
        </span>
        <div className="flex items-center gap-1">
          <span className="font-semibold text-lg">{item.quantity}</span>
          <span className="text-sm text-gray-600">{unitConfig.label}</span>
        </div>
      </div>
    );
  };

  // ✅ Render edit form based on mode
  const renderEditForm = () => {
    const canSwitchMode = barcodeType !== "ea"; // Only allow detailed mode for DSP/CS

    return (
      <div className="space-y-3">
        {/* Mode Selector */}
        {canSwitchMode && (
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => handleEditModeChange("simple")}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                editState.mode === "simple"
                  ? "bg-blue-100 text-blue-700 font-medium"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              แก้ไขแบบง่าย
            </button>
            <button
              onClick={() => handleEditModeChange("detailed")}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                editState.mode === "detailed"
                  ? "bg-green-100 text-green-700 font-medium"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              แก้ไขแบบรายละเอียด
            </button>
          </div>
        )}

        {editState.mode === "simple" ? (
          // ✅ Simple edit mode
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                handleEditQuantityChange(
                  "simpleQuantity",
                  editState.simpleQuantity - 1
                )
              }
              disabled={editState.simpleQuantity <= 1}
              className="w-8 h-8 rounded border border-gray-300 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              <Minus size={14} />
            </button>

            <input
              type="number"
              value={editState.simpleQuantity}
              onChange={(e) =>
                handleEditQuantityChange(
                  "simpleQuantity",
                  parseInt(e.target.value) || 0
                )
              }
              className="w-16 h-8 text-center border border-gray-300 rounded focus:ring-2 focus:ring-fn-green focus:border-transparent text-sm"
              min="1"
            />

            <button
              onClick={() =>
                handleEditQuantityChange(
                  "simpleQuantity",
                  editState.simpleQuantity + 1
                )
              }
              className="w-8 h-8 rounded border border-gray-300 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50"
            >
              <Plus size={14} />
            </button>

            <span className="text-sm text-gray-600">{unitConfig.label}</span>
          </div>
        ) : (
          // ✅ Detailed edit mode
          <div className="space-y-3">
            {/* Major quantity */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {unitConfig.label}
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    handleEditQuantityChange(
                      "majorQuantity",
                      editState.majorQuantity - 1
                    )
                  }
                  disabled={editState.majorQuantity <= 0}
                  className="w-8 h-8 rounded border border-gray-300 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  <Minus size={14} />
                </button>

                <input
                  type="number"
                  value={editState.majorQuantity}
                  onChange={(e) =>
                    handleEditQuantityChange(
                      "majorQuantity",
                      parseInt(e.target.value) || 0
                    )
                  }
                  className="w-16 h-8 text-center border border-gray-300 rounded focus:ring-2 focus:ring-fn-green focus:border-transparent text-sm"
                  min="0"
                />

                <button
                  onClick={() =>
                    handleEditQuantityChange(
                      "majorQuantity",
                      editState.majorQuantity + 1
                    )
                  }
                  className="w-8 h-8 rounded border border-gray-300 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Remainder quantity */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                เศษ (ชิ้น)
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    handleEditQuantityChange(
                      "remainderQuantity",
                      editState.remainderQuantity - 1
                    )
                  }
                  disabled={editState.remainderQuantity <= 0}
                  className="w-8 h-8 rounded border border-gray-300 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  <Minus size={14} />
                </button>

                <input
                  type="number"
                  value={editState.remainderQuantity}
                  onChange={(e) =>
                    handleEditQuantityChange(
                      "remainderQuantity",
                      parseInt(e.target.value) || 0
                    )
                  }
                  className="w-16 h-8 text-center border border-gray-300 rounded focus:ring-2 focus:ring-fn-green focus:border-transparent text-sm"
                  min="0"
                />

                <button
                  onClick={() =>
                    handleEditQuantityChange(
                      "remainderQuantity",
                      editState.remainderQuantity + 1
                    )
                  }
                  className="w-8 h-8 rounded border border-gray-300 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Actions */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
          >
            <CheckCircle size={14} />
            บันทึก
          </button>
          <button
            onClick={onEditCancel}
            className="flex items-center gap-1 px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
          >
            <X size={14} />
            ยกเลิก
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-medium text-gray-900 truncate">
              {item.productName}
            </h3>
          </div>

          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <span className="font-medium text-fn-green">{item.brand}</span>
              {item.category && (
                <>
                  <span className="mx-2">•</span>
                  <span>{item.category}</span>
                </>
              )}
            </p>

            {item.size && (
              <p>
                ขนาด: {item.size} {item.unit}
              </p>
            )}

            <p className="font-mono text-xs bg-gray-100 inline-block px-2 py-1 rounded">
              {item.barcode}
            </p>

            <p className="text-xs text-gray-500">
              อัพเดทล่าสุด: {formatDate(item.lastUpdated)}
            </p>
          </div>
        </div>

        {/* Quantity Section */}
        <div className="flex flex-col items-end gap-3 ml-4">
          {isEditing ? (
            renderEditForm()
          ) : (
            <>
              {/* Quantity Display */}
              <div className="text-right">{renderQuantityDisplay()}</div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Quick Adjust Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onQuickAdjust(-1)}
                    className="w-7 h-7 rounded border border-gray-300 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                    title="ลด 1"
                  >
                    <Minus size={12} />
                  </button>
                  <button
                    onClick={() => onQuickAdjust(1)}
                    className="w-7 h-7 rounded border border-gray-300 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                    title="เพิ่ม 1"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                {/* Edit Button */}
                <button
                  onClick={onEditStart}
                  className="w-7 h-7 rounded border border-gray-300 bg-white flex items-center justify-center text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
                  title="แก้ไข"
                >
                  <Edit3 size={12} />
                </button>

                {/* Remove Button */}
                <button
                  onClick={onRemove}
                  className="w-7 h-7 rounded border border-gray-300 bg-white flex items-center justify-center text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors"
                  title="ลบ"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
