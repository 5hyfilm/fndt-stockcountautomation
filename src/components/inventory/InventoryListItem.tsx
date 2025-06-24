// Path: src/components/inventory/InventoryListItem.tsx - Fixed Responsive Version
"use client";

import React, { useState, useEffect } from "react";
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

// ✅ Simplified edit state
interface EditState {
  simpleQuantity: number; // For EA items
  majorQuantity: number; // For DSP/CS items (main unit)
  remainderQuantity: number; // For DSP/CS items (remainder)
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
  onEditQuantityDetailSave,
  onEditCancel,
  onEditQuantityChange,
  onEditQuantityDetailChange,
  onRemove,
}) => {
  // ✅ Initialize edit state based on item data
  const [editState, setEditState] = useState<EditState>(() => {
    return {
      simpleQuantity:
        item.quantityDetail?.major || item.quantity || editQuantity,
      majorQuantity:
        item.quantityDetail?.major || item.quantity || editQuantity,
      remainderQuantity: item.quantityDetail?.remainder || 0,
    };
  });

  // ✅ Enhanced sync - only when editing starts, not during editing
  useEffect(() => {
    if (isEditing) {
      const newEditState = {
        simpleQuantity:
          item.quantityDetail?.major || item.quantity || editQuantity,
        majorQuantity:
          item.quantityDetail?.major || item.quantity || editQuantity,
        remainderQuantity: item.quantityDetail?.remainder || 0,
      };

      console.log("🔄 Enhanced sync edit state:", {
        isEditing,
        editQuantity,
        itemQuantity: item.quantity,
        itemQuantityDetail: item.quantityDetail,
        newEditState,
      });

      setEditState(newEditState);
    }
  }, [isEditing, editQuantity, item.quantity, item.quantityDetail]); // ✅ เพิ่ม dependencies ครบถ้วน

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
  const isDetailedUnit = barcodeType !== "ea"; // DSP or CS

  // ✅ Simplified and fixed edit quantity change handler
  const handleEditQuantityChange = (field: keyof EditState, value: number) => {
    const safeValue = Math.max(0, value);

    console.log("🔄 Changing edit quantity:", {
      field,
      value: safeValue,
      currentEditState: editState,
    });

    // ✅ Calculate new state values first
    const newState = { ...editState, [field]: safeValue };
    console.log("📝 New edit state:", newState);

    // ✅ Update local state
    setEditState(newState);

    // ✅ Sync with parent component based on field type
    if (field === "simpleQuantity") {
      // For EA items - sync simple quantity
      onEditQuantityChange(safeValue);
    } else if (field === "majorQuantity") {
      // For DSP/CS items - sync major quantity with parent
      onEditQuantityChange(safeValue);

      // Also notify about detailed changes if callback exists
      if (onEditQuantityDetailChange) {
        const quantityDetail: QuantityDetail = {
          major: safeValue,
          remainder: newState.remainderQuantity,
          scannedType: barcodeType,
        };
        onEditQuantityDetailChange(quantityDetail);
      }
    } else if (field === "remainderQuantity") {
      // For remainder changes - keep major the same but update remainder
      onEditQuantityChange(newState.majorQuantity);

      // Notify about detailed changes if callback exists
      if (onEditQuantityDetailChange) {
        const quantityDetail: QuantityDetail = {
          major: newState.majorQuantity,
          remainder: safeValue,
          scannedType: barcodeType,
        };
        onEditQuantityDetailChange(quantityDetail);
      }
    }
  };

  // ✅ Enhanced save handler
  const handleSave = () => {
    console.log("🔍 Saving inventory item:", {
      itemId: item.id,
      barcodeType,
      isDetailedUnit,
      editState,
      hasOnEditQuantityDetailSave: !!onEditQuantityDetailSave,
    });

    if (isDetailedUnit && onEditQuantityDetailSave) {
      // Save as detailed quantity for DSP/CS
      const quantityDetail: QuantityDetail = {
        major: editState.majorQuantity,
        remainder: editState.remainderQuantity,
        scannedType: barcodeType,
      };

      console.log("💾 Saving quantity detail:", quantityDetail);
      const success = onEditQuantityDetailSave(item.id, quantityDetail);
      console.log("✅ Save result:", success);

      if (success) {
        onEditSave();
      }
    } else {
      // Save as simple quantity for EA
      console.log("💾 Saving simple quantity:", editState.simpleQuantity);
      onEditQuantityChange(editState.simpleQuantity);
      onEditSave();
    }
  };

  // ✅ Enhanced cancel handler
  const handleCancel = () => {
    // Reset to original values
    const resetState = {
      simpleQuantity: item.quantityDetail?.major || item.quantity,
      majorQuantity: item.quantityDetail?.major || item.quantity,
      remainderQuantity: item.quantityDetail?.remainder || 0,
    };

    setEditState(resetState);
    onEditCancel();
  };

  // ✅ Render quantity display based on item data - Unified horizontal layout
  const renderQuantityDisplay = () => {
    if (item.quantityDetail && isDetailedUnit) {
      const { major, remainder, scannedType } = item.quantityDetail;
      const config = UNIT_CONFIG[scannedType];

      return (
        <div className="text-right min-w-0">
          {/* ✅ Unified horizontal layout */}
          <div className="flex items-center justify-end gap-2">
            <span
              className={`text-xs px-1.5 py-0.5 rounded ${config.color} font-medium flex-shrink-0`}
            >
              {config.shortLabel}
            </span>

            {/* Main quantity */}
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-gray-900">{major}</span>
              <span className="text-xs text-gray-500">{config.label}</span>
            </div>

            {/* Remainder quantity */}
            {remainder > 0 && (
              <div className="flex items-baseline gap-1">
                <span className="text-gray-400">+</span>
                <span className="text-sm font-medium text-gray-700">
                  {remainder}
                </span>
                <span className="text-xs text-gray-500">ชิ้น</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    // ✅ Simple quantity display for EA - Matching horizontal layout
    return (
      <div className="text-right min-w-0">
        {/* ✅ Unified horizontal layout */}
        <div className="flex items-center justify-end gap-2">
          <span
            className={`text-xs px-1.5 py-0.5 rounded ${unitConfig.color} font-medium flex-shrink-0`}
          >
            {unitConfig.shortLabel}
          </span>

          {/* Main quantity */}
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-gray-900">
              {item.quantity}
            </span>
            <span className="text-xs text-gray-500">{unitConfig.label}</span>
          </div>
        </div>
      </div>
    );
  };

  // ✅ Enhanced edit form
  const renderEditForm = () => {
    return (
      <div className="bg-blue-50 rounded-lg p-4 mt-3 border border-blue-200">
        <div className="space-y-3">
          {isDetailedUnit ? (
            // ✅ Detailed edit for DSP/CS - show both major and remainder
            <>
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
                    className="w-8 h-8 rounded border border-gray-300 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 flex-shrink-0"
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
                    className="w-16 h-8 text-center border border-gray-300 rounded focus:ring-2 focus:ring-fn-green focus:border-transparent text-sm flex-shrink-0"
                    min="0"
                  />

                  <button
                    onClick={() =>
                      handleEditQuantityChange(
                        "majorQuantity",
                        editState.majorQuantity + 1
                      )
                    }
                    className="w-8 h-8 rounded border border-gray-300 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 flex-shrink-0"
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
                    className="w-8 h-8 rounded border border-gray-300 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 flex-shrink-0"
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
                    className="w-16 h-8 text-center border border-gray-300 rounded focus:ring-2 focus:ring-fn-green focus:border-transparent text-sm flex-shrink-0"
                    min="0"
                  />

                  <button
                    onClick={() =>
                      handleEditQuantityChange(
                        "remainderQuantity",
                        editState.remainderQuantity + 1
                      )
                    }
                    className="w-8 h-8 rounded border border-gray-300 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 flex-shrink-0"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            // ✅ Simple edit for EA - show only one quantity
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                จำนวน ({unitConfig.label})
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    handleEditQuantityChange(
                      "simpleQuantity",
                      editState.simpleQuantity - 1
                    )
                  }
                  disabled={editState.simpleQuantity <= 1}
                  className="w-8 h-8 rounded border border-gray-300 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 flex-shrink-0"
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
                  className="w-16 h-8 text-center border border-gray-300 rounded focus:ring-2 focus:ring-fn-green focus:border-transparent text-sm flex-shrink-0"
                  min="1"
                />

                <button
                  onClick={() =>
                    handleEditQuantityChange(
                      "simpleQuantity",
                      editState.simpleQuantity + 1
                    )
                  }
                  className="w-8 h-8 rounded border border-gray-300 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 flex-shrink-0"
                >
                  <Plus size={14} />
                </button>

                <span className="text-sm text-gray-600 ml-1">
                  {unitConfig.label}
                </span>
              </div>
            </div>
          )}

          {/* Edit Actions */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSave}
              className="flex-1 bg-fn-green text-white px-3 py-2 rounded-lg hover:bg-green-600 flex items-center justify-center gap-2 text-sm font-medium min-h-[40px]"
            >
              <CheckCircle size={16} />
              บันทึก
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 bg-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-400 flex items-center justify-center gap-2 text-sm font-medium min-h-[40px]"
            >
              <X size={16} />
              ยกเลิก
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    // ✅ Fixed: Added proper container constraints and overflow handling
    <div className="w-full max-w-full bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow overflow-hidden">
      {/* ✅ Fixed: Improved responsive header layout */}
      <div className="flex items-start gap-3 mb-3">
        {/* Left Section: Icon + Product Info */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Icon */}
          <div className={`p-2 rounded-lg flex-shrink-0 ${unitConfig.color}`}>
            <unitConfig.icon size={20} />
          </div>

          {/* Product Info - Fixed text overflow */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 mb-1 break-words leading-tight">
              {item.productName}
            </h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="truncate">
                รหัส: {item.materialCode || item.barcode}
              </p>
              <p className="truncate">หมวดหมู่: {item.category}</p>
              {item.brand && <p className="truncate">แบรนด์: {item.brand}</p>}
            </div>
          </div>
        </div>

        {/* ✅ Fixed: Right Section with proper mobile constraints */}
        {!isEditing && (
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Quantity Display - Fixed mobile layout */}
            <div className="min-w-[70px]">{renderQuantityDisplay()}</div>

            {/* ✅ Action Buttons - Responsive layout */}
            <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
              <button
                onClick={onEditStart}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors touch-button"
                title="แก้ไขจำนวน"
              >
                <Edit3 size={16} />
              </button>
              <button
                onClick={onRemove}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-button"
                title="ลบรายการ"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ✅ Bottom Section */}
      {isEditing ? (
        renderEditForm()
      ) : (
        /* ✅ Timestamp with proper spacing */
        <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
          อัพเดท: {formatDate(item.lastUpdated)}
        </div>
      )}
    </div>
  );
};
