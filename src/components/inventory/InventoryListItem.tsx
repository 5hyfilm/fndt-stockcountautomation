// src/components/inventory/InventoryListItem.tsx - Unified Edit Mode
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

// ✅ Simplified edit state - no mode switching
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
  onQuickAdjust,
  onRemove,
}) => {
  // ✅ Initialize edit state based on item data
  const [editState, setEditState] = useState<EditState>({
    simpleQuantity: editQuantity,
    majorQuantity: item.quantityDetail?.major || editQuantity,
    remainderQuantity: item.quantityDetail?.remainder || 0,
  });

  // ✅ Sync editState when item data changes (when editing starts)
  useEffect(() => {
    if (isEditing) {
      const newEditState = {
        simpleQuantity: editQuantity,
        majorQuantity: item.quantityDetail?.major || editQuantity,
        remainderQuantity: item.quantityDetail?.remainder || 0,
      };

      console.log("🔄 Syncing edit state on edit start:", {
        isEditing,
        editQuantity,
        itemQuantityDetail: item.quantityDetail,
        newEditState,
      });

      setEditState(newEditState);
    }
  }, [isEditing, editQuantity, item.quantityDetail]);

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

  // ✅ Debug logging in development
  console.log("🔍 InventoryListItem render:", {
    itemId: item.id,
    barcodeType,
    isDetailedUnit,
    isEditing,
    editState,
    itemQuantityDetail: item.quantityDetail,
    hasOnEditQuantityDetailSave: !!onEditQuantityDetailSave,
  });

  // ✅ Handle edit quantity changes
  const handleEditQuantityChange = (field: keyof EditState, value: number) => {
    console.log("🔄 Changing edit quantity:", {
      field,
      value,
      currentEditState: editState,
    });

    setEditState((prev) => {
      const newState = { ...prev, [field]: Math.max(0, value) };
      console.log("📝 New edit state:", newState);

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

  // ✅ Render quantity display based on item data
  const renderQuantityDisplay = () => {
    if (item.quantityDetail && isDetailedUnit) {
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

    // ✅ Simple quantity display for EA or fallback
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

  // ✅ Render edit form based on barcode type (no mode switching)
  const renderEditForm = () => {
    return (
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
