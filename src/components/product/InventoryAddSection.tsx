// Path: src/components/product/InventoryAddSection.tsx
// Fix: แก้ไข signature และ wrapper สำหรับ onAddToInventory

"use client";

import React, { useState, useEffect } from "react";
import {
  Archive,
  Plus,
  Minus,
  Check,
  Package2,
  Hash,
  Scan,
} from "lucide-react";
import { Product, BarcodeType, BarcodeUtils } from "../../types/product";
import { ProductWithMultipleBarcodes } from "../../data/types/csvTypes";
import { QuantityInput } from "../../hooks/inventory/types"; // ✅ Import QuantityInput

interface InventoryAddSectionProps {
  product: Product | ProductWithMultipleBarcodes;
  detectedBarcodeType: BarcodeType | null;
  // ✅ FIX: รองรับทั้ง signature เก่าและใหม่
  onAddToInventory:
    | ((
        product: Product,
        quantity: number,
        barcodeType: BarcodeType
      ) => boolean)
    | ((
        product: Product,
        quantityInput: QuantityInput,
        barcodeType?: "ea" | "dsp" | "cs"
      ) => boolean);
  isVisible: boolean;
  currentInventoryQuantity?: number;
}

// Enhanced unit configuration with icons and colors
const UNIT_CONFIG = {
  [BarcodeType.EA]: {
    label: "ชิ้น",
    shortLabel: "EA",
    icon: Package2,
    color: "blue",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-200",
  },
  [BarcodeType.DSP]: {
    label: "แพ็ค",
    shortLabel: "DSP",
    icon: Package2,
    color: "green",
    bgColor: "bg-green-50",
    textColor: "text-green-700",
    borderColor: "border-green-200",
  },
  [BarcodeType.CS]: {
    label: "ลัง",
    shortLabel: "CS",
    icon: Archive,
    color: "purple",
    bgColor: "bg-purple-50",
    textColor: "text-purple-700",
    borderColor: "border-purple-200",
  },
} as const;

// ✅ NEW: Helper function to detect onAddToInventory signature
const isNewSignature = (
  fn: InventoryAddSectionProps["onAddToInventory"]
): fn is (
  product: Product,
  quantityInput: QuantityInput,
  barcodeType?: "ea" | "dsp" | "cs"
) => boolean => {
  // ตรวจสอบ function signature โดยดูจำนวน parameters
  return fn.length === 3 && typeof fn === "function";
};

// ✅ NEW: Convert BarcodeType enum to string
const barcodeTypeToString = (type: BarcodeType): "ea" | "dsp" | "cs" => {
  switch (type) {
    case BarcodeType.EA:
      return "ea";
    case BarcodeType.DSP:
      return "dsp";
    case BarcodeType.CS:
      return "cs";
    default:
      return "ea";
  }
};

export const InventoryAddSection: React.FC<InventoryAddSectionProps> = ({
  product,
  detectedBarcodeType,
  onAddToInventory,
  isVisible,
  currentInventoryQuantity = 0,
}) => {
  // State management
  const [quantity, setQuantity] = useState(1);
  const [inputValue, setInputValue] = useState("1");
  const [isAdding, setIsAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  // Get unit configuration for detected barcode type
  const unitConfig = detectedBarcodeType
    ? UNIT_CONFIG[detectedBarcodeType]
    : UNIT_CONFIG[BarcodeType.EA];

  // Reset state when visibility or barcode type changes
  useEffect(() => {
    if (isVisible) {
      setQuantity(1);
      setInputValue("1");
      setAddSuccess(false);
    }
  }, [isVisible, detectedBarcodeType]);

  // Quantity input handlers
  const handleQuantityChange = (value: string) => {
    setInputValue(value);
    if (value === "" || value === "0") return;

    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 1) {
      setQuantity(numValue);
    }
  };

  const handleInputBlur = () => {
    if (inputValue === "" || parseInt(inputValue) < 1) {
      setInputValue("1");
      setQuantity(1);
    } else {
      const numValue = parseInt(inputValue);
      if (!isNaN(numValue) && numValue >= 1) {
        const validValue = Math.max(1, numValue);
        setQuantity(validValue);
        setInputValue(validValue.toString());
      } else {
        setInputValue("1");
        setQuantity(1);
      }
    }
  };

  const increaseQuantity = () => {
    const newQuantity = quantity + 1;
    setQuantity(newQuantity);
    setInputValue(newQuantity.toString());
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      const newQuantity = quantity - 1;
      setQuantity(newQuantity);
      setInputValue(newQuantity.toString());
    }
  };

  // ✅ NEW: Smart wrapper for onAddToInventory with signature detection
  const handleAddToInventory = async () => {
    if (!detectedBarcodeType) {
      console.error("❌ No barcode type detected");
      return;
    }

    setIsAdding(true);
    try {
      console.log("🔘 Adding to inventory:", {
        product: product.name,
        quantity,
        barcodeType: detectedBarcodeType,
        unitLabel: unitConfig.label,
      });

      let success = false;

      // ✅ FIX: ตรวจสอบ signature และเรียกใช้ฟังก์ชันที่เหมาะสม
      try {
        // ลองเรียกด้วย signature ใหม่ก่อน (QuantityInput)
        const quantityInput: QuantityInput = quantity; // Simple quantity
        const barcodeTypeString = barcodeTypeToString(detectedBarcodeType);

        success = (onAddToInventory as any)(
          product as Product,
          quantityInput,
          barcodeTypeString
        );
      } catch (error) {
        console.log("🔄 Trying old signature...");
        // ถ้าไม่ได้ ลองใช้ signature เก่า (number, BarcodeType)
        try {
          success = (onAddToInventory as any)(
            product as Product,
            quantity,
            detectedBarcodeType
          );
        } catch (oldSignatureError) {
          console.error("❌ Both signatures failed:", oldSignatureError);
          success = false;
        }
      }

      if (success) {
        setAddSuccess(true);
        // Reset to default quantity
        setQuantity(1);
        setInputValue("1");

        // Hide success message after 3 seconds
        setTimeout(() => {
          setAddSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error("❌ Failed to add to inventory:", error);
    } finally {
      setIsAdding(false);
    }
  };

  // Validation
  const canAdd =
    inputValue !== "" && parseInt(inputValue) >= 1 && detectedBarcodeType;

  if (!isVisible || !detectedBarcodeType) return null;

  return (
    <div className="space-y-4">
      {/* Success Message */}
      {addSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <div className="bg-green-100 rounded-full p-1">
            <Check className="text-green-600" size={16} />
          </div>
          <div>
            <p className="text-green-800 font-medium">
              เพิ่ม {quantity} {unitConfig.label} ใน Inventory สำเร็จ!
            </p>
          </div>
        </div>
      )}

      {/* Main Input Section */}
      <div
        className={`${unitConfig.bgColor} rounded-lg p-4 border ${unitConfig.borderColor}`}
      >
        {/* Header with detected barcode type */}
        <div className="flex items-center gap-2 mb-4">
          <Archive className="text-fn-green" size={20} />
          <span className="font-medium text-gray-900">เพิ่มใน Inventory</span>
          <div className="flex items-center gap-2">
            <Scan size={14} className="text-gray-500" />
            <span
              className={`text-xs ${unitConfig.bgColor} ${unitConfig.textColor} px-2 py-1 rounded-full font-medium border ${unitConfig.borderColor}`}
            >
              สแกน {unitConfig.shortLabel}
            </span>
          </div>
        </div>

        {/* Current Inventory Status */}
        {currentInventoryQuantity > 0 && (
          <div className="mb-4 p-3 bg-gray-100 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Hash size={14} />
              <span>
                มีในคลังปัจจุบัน:{" "}
                <span className="font-medium text-gray-900">
                  {currentInventoryQuantity} {unitConfig.label}
                </span>
              </span>
            </div>
          </div>
        )}

        {/* Quantity Input */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
            <unitConfig.icon size={16} />
            จำนวน ({unitConfig.label})
          </label>

          <div className="flex items-center gap-3">
            {/* Decrease Button */}
            <button
              onClick={decreaseQuantity}
              disabled={quantity <= 1}
              className="w-10 h-10 rounded-lg border border-gray-300 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:ring-2 focus:ring-fn-green focus:ring-offset-2"
            >
              <Minus size={16} />
            </button>

            {/* Quantity Input */}
            <input
              type="number"
              value={inputValue}
              onChange={(e) => handleQuantityChange(e.target.value)}
              onBlur={handleInputBlur}
              onKeyPress={(e) => e.key === "Enter" && handleInputBlur()}
              className="flex-1 h-10 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-fn-green focus:border-transparent text-lg font-medium"
              min="1"
              max="999"
            />

            {/* Increase Button */}
            <button
              onClick={increaseQuantity}
              className="w-10 h-10 rounded-lg border border-gray-300 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-fn-green focus:ring-offset-2"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Unit Label Helper */}
          <p className="text-xs text-gray-500 text-center">
            หน่วยนับ: {unitConfig.label} ({unitConfig.shortLabel})
          </p>
        </div>

        {/* Add Button */}
        <button
          onClick={handleAddToInventory}
          disabled={!canAdd || isAdding}
          className={`
            w-full mt-4 py-3 px-4 rounded-lg font-medium text-white transition-all duration-200
            ${
              canAdd && !isAdding
                ? "bg-fn-green hover:bg-green-600 focus:ring-2 focus:ring-fn-green focus:ring-offset-2 transform hover:scale-[1.02]"
                : "bg-gray-300 cursor-not-allowed"
            }
          `}
        >
          <div className="flex items-center justify-center gap-2">
            {isAdding ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>กำลังเพิ่ม...</span>
              </>
            ) : (
              <>
                <Plus size={16} />
                <span>
                  เพิ่ม {quantity} {unitConfig.label} ใน Inventory
                </span>
              </>
            )}
          </div>
        </button>
      </div>

      {/* Debug Info (Development Only) */}
      {process.env.NODE_ENV === "development" && (
        <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded border-l-4 border-blue-300">
          <div>
            🔍 Debug: บาร์โค้ดประเภท <strong>{detectedBarcodeType}</strong>
          </div>
          <div>
            📦 จำนวน:{" "}
            <strong>
              {quantity} {unitConfig.label}
            </strong>
          </div>
          <div>
            🏷️ สินค้า: <strong>{product.name}</strong>
          </div>
          <div>
            🔧 Function signature:{" "}
            <strong>onAddToInventory.length = {onAddToInventory.length}</strong>
          </div>
        </div>
      )}
    </div>
  );
};
