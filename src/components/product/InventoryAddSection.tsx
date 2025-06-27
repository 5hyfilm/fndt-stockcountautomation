// src/components/product/InventoryAddSection.tsx - Phase 1: Enhanced with Dual Quantity Support
"use client";

import React, { useState, useEffect } from "react";
import { Archive, Plus, Minus, Check, Package2, Hash } from "lucide-react";
import { Product } from "../../types/product";
import { QuantityInput, QuantityDetail } from "../../hooks/inventory/types";

interface InventoryAddSectionProps {
  product: Product;
  currentInventoryQuantity: number;
  onAddToInventory: (
    product: Product,
    quantityInput: QuantityInput,
    barcodeType?: "ea" | "dsp" | "cs"
  ) => boolean;
  isVisible: boolean;
  barcodeType?: "ea" | "dsp" | "cs";
}

// ✅ Unit configuration for different barcode types
const UNIT_CONFIG = {
  ea: { label: "ชิ้น", shortLabel: "EA", icon: Package2 },
  dsp: { label: "แพ็ค", shortLabel: "DSP", icon: Package2 },
  cs: { label: "ลัง", shortLabel: "CS", icon: Archive },
};

export const InventoryAddSection: React.FC<InventoryAddSectionProps> = ({
  product,
  onAddToInventory,
  isVisible,
  barcodeType = "ea",
}) => {
  // ✅ State for both simple and detailed quantity input
  const [simpleQuantity, setSimpleQuantity] = useState(1);
  const [simpleInputValue, setSimpleInputValue] = useState("1");

  // ✅ State for dual quantity input (DSP/CS + EA remainder)
  const [majorQuantity, setMajorQuantity] = useState(1);
  const [majorInputValue, setMajorInputValue] = useState("1");
  const [remainderQuantity, setRemainderQuantity] = useState(0);
  const [remainderInputValue, setRemainderInputValue] = useState("0");

  const [isAdding, setIsAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  // ✅ Determine if we need dual quantity input
  const needsDualQuantity = barcodeType === "dsp" || barcodeType === "cs";
  const unitConfig = UNIT_CONFIG[barcodeType];

  // Reset states when visibility or barcode type changes
  useEffect(() => {
    if (isVisible) {
      setSimpleQuantity(1);
      setSimpleInputValue("1");
      setMajorQuantity(1);
      setMajorInputValue("1");
      setRemainderQuantity(0);
      setRemainderInputValue("0");
      setAddSuccess(false);
    }
  }, [isVisible, barcodeType]);

  // ✅ Handlers for simple quantity (EA only)
  const handleSimpleQuantityChange = (value: string) => {
    setSimpleInputValue(value);
    if (value === "" || value === "0") return;

    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 1) {
      setSimpleQuantity(numValue);
    }
  };

  const handleSimpleInputBlur = () => {
    if (simpleInputValue === "" || parseInt(simpleInputValue) < 1) {
      setSimpleInputValue("1");
      setSimpleQuantity(1);
    } else {
      const numValue = parseInt(simpleInputValue);
      if (!isNaN(numValue) && numValue >= 1) {
        const validValue = Math.max(1, numValue);
        setSimpleQuantity(validValue);
        setSimpleInputValue(validValue.toString());
      } else {
        setSimpleInputValue("1");
        setSimpleQuantity(1);
      }
    }
  };

  const increaseSimpleQuantity = () => {
    const newQuantity = simpleQuantity + 1;
    setSimpleQuantity(newQuantity);
    setSimpleInputValue(newQuantity.toString());
  };

  const decreaseSimpleQuantity = () => {
    if (simpleQuantity > 1) {
      const newQuantity = simpleQuantity - 1;
      setSimpleQuantity(newQuantity);
      setSimpleInputValue(newQuantity.toString());
    }
  };

  // ✅ Handlers for major quantity (DSP/CS)
  const handleMajorQuantityChange = (value: string) => {
    setMajorInputValue(value);
    if (value === "" || value === "0") return;

    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setMajorQuantity(numValue);
    }
  };

  const handleMajorInputBlur = () => {
    if (majorInputValue === "" || parseInt(majorInputValue) < 0) {
      setMajorInputValue("1");
      setMajorQuantity(1);
    } else {
      const numValue = parseInt(majorInputValue);
      if (!isNaN(numValue) && numValue >= 0) {
        const validValue = Math.max(0, numValue);
        setMajorQuantity(validValue);
        setMajorInputValue(validValue.toString());
      } else {
        setMajorInputValue("1");
        setMajorQuantity(1);
      }
    }
  };

  const increaseMajorQuantity = () => {
    const newQuantity = majorQuantity + 1;
    setMajorQuantity(newQuantity);
    setMajorInputValue(newQuantity.toString());
  };

  const decreaseMajorQuantity = () => {
    if (majorQuantity > 0) {
      const newQuantity = majorQuantity - 1;
      setMajorQuantity(newQuantity);
      setMajorInputValue(newQuantity.toString());
    }
  };

  // ✅ Handlers for remainder quantity (EA)
  const handleRemainderQuantityChange = (value: string) => {
    setRemainderInputValue(value);
    if (value === "") return;

    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setRemainderQuantity(numValue);
    }
  };

  const handleRemainderInputBlur = () => {
    if (remainderInputValue === "" || parseInt(remainderInputValue) < 0) {
      setRemainderInputValue("0");
      setRemainderQuantity(0);
    } else {
      const numValue = parseInt(remainderInputValue);
      if (!isNaN(numValue) && numValue >= 0) {
        const validValue = Math.max(0, numValue);
        setRemainderQuantity(validValue);
        setRemainderInputValue(validValue.toString());
      } else {
        setRemainderInputValue("0");
        setRemainderQuantity(0);
      }
    }
  };

  const increaseRemainderQuantity = () => {
    const newQuantity = remainderQuantity + 1;
    setRemainderQuantity(newQuantity);
    setRemainderInputValue(newQuantity.toString());
  };

  const decreaseRemainderQuantity = () => {
    if (remainderQuantity > 0) {
      const newQuantity = remainderQuantity - 1;
      setRemainderQuantity(newQuantity);
      setRemainderInputValue(newQuantity.toString());
    }
  };

  // ✅ Handle adding to inventory with appropriate quantity format
  const handleAddToInventory = async () => {
    setIsAdding(true);
    try {
      let quantityInput: QuantityInput;

      if (needsDualQuantity) {
        // ✅ Create QuantityDetail for DSP/CS
        const quantityDetail: QuantityDetail = {
          major: majorQuantity,
          remainder: remainderQuantity,
          scannedType: barcodeType,
        };
        quantityInput = quantityDetail;

        console.log("🔘 Adding with quantity detail:", {
          product: product.name,
          major: majorQuantity,
          remainder: remainderQuantity,
          scannedType: barcodeType,
        });
      } else {
        // ✅ Use simple quantity for EA
        quantityInput = simpleQuantity;

        console.log("🔘 Adding with simple quantity:", {
          product: product.name,
          quantity: simpleQuantity,
          barcodeType,
        });
      }

      const success = onAddToInventory(product, quantityInput, barcodeType);

      if (success) {
        setAddSuccess(true);

        // Reset inputs
        if (needsDualQuantity) {
          setMajorQuantity(1);
          setMajorInputValue("1");
          setRemainderQuantity(0);
          setRemainderInputValue("0");
        } else {
          setSimpleQuantity(1);
          setSimpleInputValue("1");
        }

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

  // ✅ Determine if can add
  const canAdd = needsDualQuantity
    ? majorQuantity > 0 || remainderQuantity > 0
    : simpleInputValue !== "" && parseInt(simpleInputValue) >= 1;

  if (!isVisible) return null;

  return (
    <div className="space-y-4">
      {/* Success Message */}
      {addSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <div className="bg-green-100 rounded-full p-1">
            <Check className="text-green-600" size={16} />
          </div>
          <div>
            <p className="text-green-800 font-medium">
              เพิ่มใน Inventory สำเร็จ!
            </p>
          </div>
        </div>
      )}

      {/* Quantity Input Section */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Archive className="text-fn-green" size={20} />
          <span className="font-medium text-gray-900">เพิ่มใน Inventory</span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
            {unitConfig.shortLabel}
          </span>
        </div>

        {needsDualQuantity ? (
          // ✅ Dual quantity input for DSP/CS
          <div className="space-y-4">
            {/* Major Unit Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <unitConfig.icon size={16} />
                {unitConfig.label}
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={decreaseMajorQuantity}
                  disabled={majorQuantity <= 0}
                  className="w-10 h-10 rounded-lg border border-gray-300 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus size={16} />
                </button>

                <input
                  type="number"
                  value={majorInputValue}
                  onChange={(e) => handleMajorQuantityChange(e.target.value)}
                  onBlur={handleMajorInputBlur}
                  onKeyPress={(e) =>
                    e.key === "Enter" && handleMajorInputBlur()
                  }
                  className="w-20 h-10 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-fn-green focus:border-transparent"
                  min="0"
                />

                <button
                  onClick={increaseMajorQuantity}
                  className="w-10 h-10 rounded-lg border border-gray-300 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Plus size={16} />
                </button>

                <span className="text-sm text-gray-600 ml-1">
                  {unitConfig.label}
                </span>
              </div>
            </div>

            {/* Remainder Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <Hash size={16} />
                เศษ (ชิ้น)
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={decreaseRemainderQuantity}
                  disabled={remainderQuantity <= 0}
                  className="w-10 h-10 rounded-lg border border-gray-300 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus size={16} />
                </button>

                <input
                  type="number"
                  value={remainderInputValue}
                  onChange={(e) =>
                    handleRemainderQuantityChange(e.target.value)
                  }
                  onBlur={handleRemainderInputBlur}
                  onKeyPress={(e) =>
                    e.key === "Enter" && handleRemainderInputBlur()
                  }
                  className="w-20 h-10 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-fn-green focus:border-transparent"
                  min="0"
                />

                <button
                  onClick={increaseRemainderQuantity}
                  className="w-10 h-10 rounded-lg border border-gray-300 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Plus size={16} />
                </button>

                <span className="text-sm text-gray-600 ml-1">ชิ้น</span>
              </div>
            </div>

            {/* Summary Display */}
            {(majorQuantity > 0 || remainderQuantity > 0) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">จะเพิ่ม: </span>
                  {majorQuantity > 0 && (
                    <span>
                      {majorQuantity} {unitConfig.label}
                    </span>
                  )}
                  {majorQuantity > 0 && remainderQuantity > 0 && (
                    <span> + </span>
                  )}
                  {remainderQuantity > 0 && (
                    <span>{remainderQuantity} ชิ้น</span>
                  )}
                </p>
              </div>
            )}
          </div>
        ) : (
          // ✅ Simple quantity input for EA
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <unitConfig.icon size={16} />
              จำนวน ({unitConfig.label})
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={decreaseSimpleQuantity}
                disabled={simpleQuantity <= 1}
                className="w-10 h-10 rounded-lg border border-gray-300 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Minus size={16} />
              </button>

              <input
                type="number"
                value={simpleInputValue}
                onChange={(e) => handleSimpleQuantityChange(e.target.value)}
                onBlur={handleSimpleInputBlur}
                onKeyPress={(e) => e.key === "Enter" && handleSimpleInputBlur()}
                className="w-20 h-10 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-fn-green focus:border-transparent"
                min="1"
              />

              <button
                onClick={increaseSimpleQuantity}
                className="w-10 h-10 rounded-lg border border-gray-300 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Plus size={16} />
              </button>

              <span className="text-sm text-gray-600 ml-1">
                {unitConfig.label}
              </span>
            </div>
          </div>
        )}

        {/* Add Button */}
        <button
          onClick={handleAddToInventory}
          disabled={!canAdd || isAdding}
          className="w-full mt-4 bg-fn-green text-white py-3 px-4 rounded-lg font-medium hover:bg-fn-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isAdding ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
              กำลังเพิ่ม...
            </>
          ) : (
            <>
              <Plus size={16} />
              เพิ่มใน Inventory
            </>
          )}
        </button>
      </div>
    </div>
  );
};
