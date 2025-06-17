// src/components/product/InventoryAddSection.tsx - Complete Implementation with Dual Unit Support

"use client";

import React, { useState, useEffect } from "react";
import {
  Archive,
  Plus,
  Minus,
  Check,
  Package2,
  Box,
  AlertCircle,
  ShoppingCart,
} from "lucide-react";
import { Product } from "../../types/product";
import { ProductWithMultipleBarcodes } from "../../data/types/csvTypes";
import {
  createDualUnitInput,
  isSingleUnitInput,
  validateDualUnitInput,
  createInputDescription,
  UnitType,
  DualUnitInput,
} from "../../data/services/unitPriorityService";
import { DualUnitInputData } from "../../hooks/inventory/types";

interface InventoryAddSectionProps {
  product: ProductWithMultipleBarcodes;
  currentInventoryQuantity: number;
  onAddToInventory: (
    product: Product,
    quantity: number,
    barcodeType?: "ea" | "dsp" | "cs"
  ) => boolean;
  onAddToInventoryDualUnit?: (
    product: Product,
    dualUnitData: DualUnitInputData
  ) => boolean;
  isVisible: boolean;
  barcodeType?: "ea" | "dsp" | "cs";
}

export const InventoryAddSection: React.FC<InventoryAddSectionProps> = ({
  product,
  onAddToInventory,
  onAddToInventoryDualUnit,
  isVisible,
  barcodeType = "ea",
}) => {
  // ✅ ตัวแปรสำหรับ dual unit input
  const [primaryValue, setPrimaryValue] = useState(0);
  const [secondaryValue, setSecondaryValue] = useState(0);
  const [primaryInput, setPrimaryInput] = useState("0");
  const [secondaryInput, setSecondaryInput] = useState("0");

  // ✅ ตัวแปรสำหรับ single unit (EA) - เก็บไว้ compatibility
  const [singleQuantity, setSingleQuantity] = useState(1);
  const [singleInput, setSingleInput] = useState("1");

  const [isAdding, setIsAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // ✅ คำนวณ dual unit configuration
  const scannedUnit: UnitType = barcodeType as UnitType;
  const isSingleUnit = isSingleUnitInput(scannedUnit);
  const dualUnitConfig: DualUnitInput | null = isSingleUnit
    ? null
    : createDualUnitInput(scannedUnit, product);

  // ✅ DEBUG: Log configuration
  console.log("🔍 InventoryAddSection Debug:", {
    barcodeType,
    scannedUnit,
    isSingleUnit,
    hasDualUnitConfig: !!dualUnitConfig,
    hasOnAddToInventoryDualUnit: !!onAddToInventoryDualUnit,
    productBarcodes: product.barcodes,
  });

  // ✅ ดึง barcode ของแต่ละหน่วย
  const getBarcodeForUnit = (unitType: UnitType): string | null => {
    switch (unitType) {
      case "cs":
        return product.barcodes.cs || null;
      case "dsp":
        return product.barcodes.dsp || null;
      case "ea":
        return product.barcodes.ea || null;
      default:
        return null;
    }
  };

  const primaryBarcode = getBarcodeForUnit(scannedUnit);
  const secondaryBarcode = dualUnitConfig
    ? getBarcodeForUnit(dualUnitConfig.secondaryUnit.type as UnitType)
    : null;

  // Reset states when visibility changes
  useEffect(() => {
    if (isVisible) {
      if (isSingleUnit) {
        setSingleQuantity(1);
        setSingleInput("1");
      } else {
        setPrimaryValue(0);
        setSecondaryValue(0);
        setPrimaryInput("0");
        setSecondaryInput("0");
      }
      setAddSuccess(false);
      setValidationError(null);
    }
  }, [isVisible, isSingleUnit]);

  // ✅ Handle single unit input (EA)
  const handleSingleQuantityChange = (value: string) => {
    setSingleInput(value);

    if (value === "" || value === "0") return;

    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 1) {
      setSingleQuantity(numValue);
    }
  };

  const handleSingleInputBlur = () => {
    if (singleInput === "" || parseInt(singleInput) < 1) {
      setSingleInput("1");
      setSingleQuantity(1);
    } else {
      const numValue = parseInt(singleInput);
      if (!isNaN(numValue) && numValue >= 1) {
        const validValue = Math.max(1, numValue);
        setSingleQuantity(validValue);
        setSingleInput(validValue.toString());
      } else {
        setSingleInput("1");
        setSingleQuantity(1);
      }
    }
  };

  // ✅ Handle dual unit input
  const handlePrimaryValueChange = (value: string) => {
    setPrimaryInput(value);
    setValidationError(null);

    const numValue = parseInt(value) || 0;
    if (numValue >= 0) {
      setPrimaryValue(numValue);
    }
  };

  const handleSecondaryValueChange = (value: string) => {
    setSecondaryInput(value);
    setValidationError(null);

    const numValue = parseInt(value) || 0;
    if (numValue >= 0) {
      setSecondaryValue(numValue);
    }
  };

  const handlePrimaryInputBlur = () => {
    const numValue = parseInt(primaryInput) || 0;
    const validValue = Math.max(0, numValue);
    setPrimaryValue(validValue);
    setPrimaryInput(validValue.toString());
  };

  const handleSecondaryInputBlur = () => {
    const numValue = parseInt(secondaryInput) || 0;
    const validValue = Math.max(0, numValue);
    setSecondaryValue(validValue);
    setSecondaryInput(validValue.toString());
  };

  // ✅ Quantity adjustment functions
  const adjustSingleQuantity = (delta: number) => {
    const newValue = Math.max(1, singleQuantity + delta);
    setSingleQuantity(newValue);
    setSingleInput(newValue.toString());
  };

  const adjustPrimaryValue = (delta: number) => {
    const newValue = Math.max(0, primaryValue + delta);
    setPrimaryValue(newValue);
    setPrimaryInput(newValue.toString());
  };

  const adjustSecondaryValue = (delta: number) => {
    const newValue = Math.max(0, secondaryValue + delta);
    setSecondaryValue(newValue);
    setSecondaryInput(newValue.toString());
  };

  // ✅ Handle add to inventory
  const handleAddToInventory = async () => {
    setIsAdding(true);
    setValidationError(null);

    console.log("🚀 handleAddToInventory START:", {
      isSingleUnit,
      dualUnitConfig: !!dualUnitConfig,
      primaryValue,
      secondaryValue,
      singleQuantity,
      hasOnAddToInventoryDualUnit: !!onAddToInventoryDualUnit,
    });

    try {
      let success = false;

      if (isSingleUnit) {
        console.log("📱 Using SINGLE unit path (EA)");
        // Single unit (EA) - ใช้ method เดิม
        const finalQuantity =
          singleInput === "" || parseInt(singleInput) < 1 ? 1 : singleQuantity;
        success = onAddToInventory(product, finalQuantity, barcodeType);

        if (success) {
          setSingleQuantity(1);
          setSingleInput("1");
        }
      } else {
        console.log("📦 Using DUAL unit path (CS/DSP)");
        // Dual unit - ใช้ method ใหม่
        if (!dualUnitConfig) {
          throw new Error("ไม่สามารถกำหนด configuration ของหน่วยได้");
        }

        // Validate input
        const validation = validateDualUnitInput(
          primaryValue,
          secondaryValue,
          dualUnitConfig
        );
        if (!validation.isValid) {
          setValidationError(validation.error!);
          console.log("❌ Validation failed:", validation.error);
          return;
        }

        // สร้างข้อมูล dual unit
        const dualUnitData: DualUnitInputData = {
          primaryValue,
          secondaryValue,
          primaryUnitType: dualUnitConfig.primaryUnit.type as "cs" | "dsp",
          secondaryUnitType: dualUnitConfig.secondaryUnit.type as
            | "dsp"
            | "ea"
            | "fractional",
          scannedBarcodeType: barcodeType,
        };

        console.log("🔄 Created dualUnitData:", dualUnitData);

        if (onAddToInventoryDualUnit) {
          console.log("✅ Calling onAddToInventoryDualUnit");
          success = onAddToInventoryDualUnit(product, dualUnitData);
        } else {
          console.log(
            "⚠️ onAddToInventoryDualUnit not available, using fallback"
          );
          // Fallback: convert to single unit
          const totalQuantity = primaryValue + secondaryValue; // Simple conversion
          success = onAddToInventory(product, totalQuantity, barcodeType);
        }

        if (success) {
          setPrimaryValue(0);
          setSecondaryValue(0);
          setPrimaryInput("0");
          setSecondaryInput("0");
        }
      }

      console.log("🎯 Add to inventory result:", success);

      if (success) {
        setAddSuccess(true);
        setTimeout(() => setAddSuccess(false), 3000);
      }
    } catch (error) {
      console.error("❌ Failed to add to inventory:", error);
      setValidationError("เกิดข้อผิดพลาดในการเพิ่มข้อมูล");
    } finally {
      setIsAdding(false);
    }
  };

  if (!isVisible) return null;

  // ✅ Check if can add
  const canAdd = isSingleUnit
    ? singleQuantity > 0
    : primaryValue > 0 || secondaryValue > 0;

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-fn-green/10 p-2 rounded-lg">
          <Archive className="text-fn-green" size={24} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            เพิ่มใน Inventory
          </h3>
          <p className="text-sm text-gray-600">
            {isSingleUnit
              ? "กรอกจำนวนที่ต้องการเพิ่ม"
              : dualUnitConfig
              ? createInputDescription(dualUnitConfig)
              : "กรอกจำนวนที่ต้องการเพิ่ม"}
          </p>
        </div>
      </div>

      {/* Validation Error Display */}
      {validationError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="text-red-500 mt-0.5" size={16} />
          <div className="text-sm text-red-700">{validationError}</div>
        </div>
      )}

      {/* Input Section */}
      <div className="mb-6">
        {isSingleUnit ? (
          // ✅ Single Unit Input (EA)
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {/* ✅ ส่วนชื่อหน่วย + barcode */}
              <div className="flex items-center gap-2 min-w-[240px]">
                <ShoppingCart className="text-green-600" size={16} />
                <div>
                  <div className="text-sm font-medium text-gray-700">
                    จำนวน (ชิ้น):
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    หน่วยผลิตภัณฑ์ต่อชิ้น
                  </div>
                  {primaryBarcode && (
                    <div className="text-xs text-green-600 font-mono mt-1 bg-green-50 px-2 py-1 rounded">
                      ✓ {primaryBarcode}
                    </div>
                  )}
                </div>
              </div>

              {/* ✅ ส่วนควบคุมจำนวน */}
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => adjustSingleQuantity(-1)}
                  disabled={singleQuantity <= 1 || isAdding}
                  className="bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 px-3 py-2 transition-colors"
                >
                  <Minus size={16} />
                </button>
                <input
                  type="number"
                  value={singleInput}
                  onChange={(e) => handleSingleQuantityChange(e.target.value)}
                  onBlur={handleSingleInputBlur}
                  min="1"
                  disabled={isAdding}
                  className="w-20 text-center py-2 border-none outline-none bg-white text-gray-900 font-medium disabled:bg-gray-50"
                  placeholder="1"
                />
                <button
                  onClick={() => adjustSingleQuantity(1)}
                  disabled={isAdding}
                  className="bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 px-3 py-2 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Add Button for Single Unit */}
            <button
              onClick={handleAddToInventory}
              disabled={isAdding || !canAdd}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                addSuccess
                  ? "bg-green-100 text-green-700 border-green-200 cursor-not-allowed"
                  : isAdding || !canAdd
                  ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                  : "bg-fn-green text-white border-fn-green hover:bg-fn-green/90 hover:scale-105 active:scale-95"
              }`}
            >
              {isAdding
                ? "กำลังเพิ่ม..."
                : addSuccess
                ? "เพิ่มแล้ว ✓"
                : "เพิ่มใน Inventory"}
            </button>
          </div>
        ) : (
          // ✅ Dual Unit Input (CS/DSP)
          <div className="space-y-4">
            {dualUnitConfig && (
              <>
                {/* Primary Unit Input */}
                <div className="flex items-center gap-4">
                  {/* ✅ ส่วนชื่อหน่วย + barcode */}
                  <div className="flex items-center gap-2 min-w-[240px]">
                    <Package2 className="text-blue-600" size={16} />
                    <div>
                      <div className="text-sm font-medium text-gray-700">
                        {dualUnitConfig.primaryUnit.shortLabel}:
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {dualUnitConfig.primaryUnit.description}
                      </div>
                      {primaryBarcode && (
                        <div className="text-xs text-blue-600 font-mono mt-1 bg-blue-50 px-2 py-1 rounded">
                          ✓ {primaryBarcode}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ✅ ส่วนควบคุมจำนวน */}
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => adjustPrimaryValue(-1)}
                      disabled={primaryValue <= 0 || isAdding}
                      className="bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 px-3 py-2 transition-colors"
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      type="number"
                      value={primaryInput}
                      onChange={(e) => handlePrimaryValueChange(e.target.value)}
                      onBlur={handlePrimaryInputBlur}
                      min="0"
                      disabled={isAdding}
                      className="w-20 text-center py-2 border-none outline-none bg-white text-gray-900 font-medium disabled:bg-gray-50"
                      placeholder="0"
                    />
                    <button
                      onClick={() => adjustPrimaryValue(1)}
                      disabled={isAdding}
                      className="bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 px-3 py-2 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Secondary Unit Input */}
                <div className="flex items-center gap-4">
                  {/* ✅ ส่วนชื่อหน่วย + barcode */}
                  <div className="flex items-center gap-2 min-w-[240px]">
                    <Box className="text-green-600" size={16} />
                    <div>
                      <div className="text-sm font-medium text-gray-700">
                        {dualUnitConfig.secondaryUnit.shortLabel}:
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {dualUnitConfig.secondaryUnit.description}
                      </div>
                      {/* ✅ แสดง barcode ของหน่วยรอง */}
                      {secondaryBarcode ? (
                        <div className="text-xs text-green-600 font-mono mt-1 bg-green-50 px-2 py-1 rounded">
                          ○ {secondaryBarcode}
                        </div>
                      ) : dualUnitConfig.allowFractional ? (
                        <div className="text-xs text-amber-600 font-mono mt-1 bg-amber-50 px-2 py-1 rounded">
                          ⚠ ไม่มี barcode (เศษ)
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 font-mono mt-1 bg-gray-50 px-2 py-1 rounded">
                          - ไม่มี barcode
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ✅ ส่วนควบคุมจำนวน */}
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => adjustSecondaryValue(-1)}
                      disabled={secondaryValue <= 0 || isAdding}
                      className="bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 px-3 py-2 transition-colors"
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      type="number"
                      value={secondaryInput}
                      onChange={(e) =>
                        handleSecondaryValueChange(e.target.value)
                      }
                      onBlur={handleSecondaryInputBlur}
                      min="0"
                      disabled={isAdding}
                      className="w-20 text-center py-2 border-none outline-none bg-white text-gray-900 font-medium disabled:bg-gray-50"
                      placeholder="0"
                    />
                    <button
                      onClick={() => adjustSecondaryValue(1)}
                      disabled={isAdding}
                      className="bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 px-3 py-2 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Summary Display */}
                {(primaryValue > 0 || secondaryValue > 0) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-sm text-blue-800">
                      <strong>สรุป:</strong>{" "}
                      {primaryValue > 0 &&
                        `${primaryValue} ${dualUnitConfig.primaryUnit.shortLabel}`}
                      {primaryValue > 0 && secondaryValue > 0 && " + "}
                      {secondaryValue > 0 &&
                        `${secondaryValue} ${dualUnitConfig.secondaryUnit.shortLabel}`}
                    </div>
                  </div>
                )}

                {/* Add Button for Dual Unit */}
                <button
                  onClick={handleAddToInventory}
                  disabled={isAdding || !canAdd}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                    addSuccess
                      ? "bg-green-100 text-green-700 border-green-200 cursor-not-allowed"
                      : isAdding || !canAdd
                      ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                      : "bg-fn-green text-white border-fn-green hover:bg-fn-green/90 hover:scale-105 active:scale-95"
                  }`}
                >
                  {isAdding
                    ? "กำลังเพิ่ม..."
                    : addSuccess
                    ? "เพิ่มแล้ว ✓"
                    : "เพิ่มใน Inventory"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
