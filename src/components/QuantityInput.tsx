// src/components/QuantityInput.tsx - Updated with better UX
"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  Plus,
  Minus,
  Save,
  Package,
  Check,
  AlertCircle,
  Calculator,
  X,
  Scan,
} from "lucide-react";
import { Product } from "../types/product";

interface QuantityInputProps {
  product: Product;
  onSave: (quantity: number, unit: "ea" | "dsp" | "cs", notes?: string) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  defaultQuantity?: number;
  autoFocus?: boolean;
}

export const QuantityInput: React.FC<QuantityInputProps> = ({
  product,
  onSave,
  onCancel,
  isLoading = false,
  defaultQuantity = 1,
  autoFocus = true,
}) => {
  const [quantity, setQuantity] = useState<number>(defaultQuantity);
  const [notes, setNotes] = useState<string>("");
  const [selectedUnit, setSelectedUnit] = useState<"ea" | "dsp" | "cs">("ea");
  const [showSuccess, setShowSuccess] = useState(false);
  const [condition, setCondition] = useState<
    "good" | "damaged" | "expired" | "returned"
  >("good");

  // Unit options based on barcode types
  const unitOptions = [
    {
      value: "ea" as const,
      label: "ชิ้น (Each)",
      icon: Package,
      description: "นับตามชิ้นย่อย",
      available: !!product.barcodes?.ea || !product.barcodes,
      barcode: product.barcodes?.ea || product.barcode,
    },
    {
      value: "dsp" as const,
      label: "แพ็ค (Display Pack)",
      icon: Package,
      description: "นับตามแพ็คจัดแสดง",
      available: !!product.barcodes?.dsp,
      barcode: product.barcodes?.dsp,
    },
    {
      value: "cs" as const,
      label: "ลัง (Case/Carton)",
      icon: Package,
      description: "นับตามลัง/กล่องใหญ่",
      available: !!product.barcodes?.cs,
      barcode: product.barcodes?.cs,
    },
  ].filter((option) => option.available);

  // Set default unit based on scanned barcode type
  useEffect(() => {
    if (product.barcodes?.scannedType) {
      setSelectedUnit(product.barcodes.scannedType);
    }
  }, [product.barcodes?.scannedType]);

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 0 && newQuantity <= 9999) {
      setQuantity(newQuantity);
    }
  };

  const incrementQuantity = () => {
    handleQuantityChange(quantity + 1);
  };

  const decrementQuantity = () => {
    handleQuantityChange(quantity - 1);
  };

  const handleSave = useCallback(() => {
    if (quantity > 0) {
      // Add condition to notes if not good
      let finalNotes = notes;
      if (condition !== "good") {
        const conditionLabels = {
          damaged: "สินค้าเสียหาย",
          expired: "สินค้าหมดอายุ",
          returned: "สินค้าคืน",
          good: "สินค้าปกติ",
        };
        finalNotes = finalNotes
          ? `${conditionLabels[condition]} - ${finalNotes}`
          : conditionLabels[condition];
      }

      onSave(quantity, selectedUnit, finalNotes);
      setShowSuccess(true);

      // Reset form after save
      setTimeout(() => {
        setQuantity(defaultQuantity);
        setNotes("");
        setCondition("good");
        setShowSuccess(false);
      }, 1500);
    }
  }, [quantity, selectedUnit, notes, condition, onSave, defaultQuantity]);

  const handleQuickQuantity = (value: number) => {
    setQuantity(value);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  if (showSuccess) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="text-center">
          <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
            <Check className="text-green-600" size={32} />
          </div>
          <h3 className="text-lg font-semibold text-green-600 mb-2">
            บันทึกสำเร็จ!
          </h3>
          <p className="text-gray-600">
            จำนวน: {quantity}{" "}
            {unitOptions.find((u) => u.value === selectedUnit)?.label}
          </p>
          <p className="text-sm text-gray-500 mt-1">{product.name}</p>

          <div className="mt-4 text-xs text-gray-400">
            กำลังเตรียมสแกนรายการถัดไป...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
              <Calculator size={20} />
            </div>
            <div>
              <h3 className="font-semibold">บันทึกจำนวน</h3>
              <p className="text-blue-100 text-sm">{product.name}</p>
            </div>
          </div>

          {onCancel && (
            <button
              onClick={handleCancel}
              className="text-blue-100 hover:text-white p-1 rounded"
              title="ข้าม"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Scanned Barcode Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Scan size={16} className="text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              ตรวจจับแล้ว
            </span>
          </div>
          <div className="text-xs text-blue-700 space-y-1">
            <div>
              บาร์โค้ด:{" "}
              <code className="bg-blue-100 px-2 py-1 rounded">
                {product.barcode}
              </code>
            </div>
            {product.barcodes?.scannedType && (
              <div>
                หน่วย:{" "}
                {product.barcodes.scannedType === "ea"
                  ? "ชิ้น (Each)"
                  : product.barcodes.scannedType === "dsp"
                  ? "แพ็ค (Display Pack)"
                  : "ลัง (Case/Carton)"}
              </div>
            )}
          </div>
        </div>

        {/* Unit Selection */}
        {unitOptions.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              หน่วยนับ:
            </label>
            <div className="grid grid-cols-1 gap-2">
              {unitOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedUnit === option.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="unit"
                    value={option.value}
                    checked={selectedUnit === option.value}
                    onChange={(e) =>
                      setSelectedUnit(e.target.value as "ea" | "dsp" | "cs")
                    }
                    className="sr-only"
                  />
                  <option.icon
                    size={16}
                    className={`mr-3 ${
                      selectedUnit === option.value
                        ? "text-blue-600"
                        : "text-gray-400"
                    }`}
                  />
                  <div className="flex-1">
                    <div
                      className={`text-sm font-medium ${
                        selectedUnit === option.value
                          ? "text-blue-800"
                          : "text-gray-700"
                      }`}
                    >
                      {option.label}
                    </div>
                    <div className="text-xs text-gray-500">
                      {option.description}
                    </div>
                    {option.barcode && (
                      <div className="text-xs text-gray-400 font-mono mt-1">
                        {option.barcode}
                      </div>
                    )}
                  </div>
                  {selectedUnit === option.value && (
                    <Check size={16} className="text-blue-600" />
                  )}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Quantity Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            จำนวน:
          </label>

          {/* Quick Quantity Buttons */}
          <div className="grid grid-cols-5 gap-2 mb-3">
            {[1, 5, 10, 25, 50].map((value) => (
              <button
                key={value}
                onClick={() => handleQuickQuantity(value)}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                  quantity === value
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 hover:border-gray-400 text-gray-700"
                }`}
              >
                {value}
              </button>
            ))}
          </div>

          {/* Manual Quantity Input */}
          <div className="flex items-center space-x-3">
            <button
              onClick={decrementQuantity}
              disabled={quantity <= 0}
              className="bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 p-3 rounded-lg transition-colors"
            >
              <Minus size={16} />
            </button>

            <div className="flex-1">
              <input
                type="number"
                value={quantity}
                onChange={(e) =>
                  handleQuantityChange(parseInt(e.target.value) || 0)
                }
                className="w-full px-4 py-3 text-center text-lg font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                max="9999"
                autoFocus={autoFocus}
              />
            </div>

            <button
              onClick={incrementQuantity}
              disabled={quantity >= 9999}
              className="bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 p-3 rounded-lg transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>

          {quantity === 0 && (
            <div className="flex items-center gap-2 mt-2 text-amber-600">
              <AlertCircle size={14} />
              <span className="text-sm">กรุณาระบุจำนวนที่มากกว่า 0</span>
            </div>
          )}
        </div>

        {/* Condition */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            สภาพสินค้า:
          </label>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value as typeof condition)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="good">ปกติ</option>
            <option value="damaged">เสียหาย</option>
            <option value="expired">หมดอายุ</option>
            <option value="returned">คืนสินค้า</option>
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            หมายเหตุ (ไม่บังคับ):
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="เช่น ตำแหน่งจัดเก็บ, เลขที่ล็อต, หรือข้อมูลเพิ่มเติม..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={3}
            maxLength={200}
          />
          <div className="text-xs text-gray-500 mt-1">
            {notes.length}/200 ตัวอักษร
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">สรุป:</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">สินค้า:</span>
              <span className="font-medium">{product.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">จำนวน:</span>
              <span className="font-medium">
                {quantity}{" "}
                {unitOptions.find((u) => u.value === selectedUnit)?.label}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">สภาพ:</span>
              <span
                className={`font-medium ${
                  condition === "good"
                    ? "text-green-600"
                    : condition === "damaged"
                    ? "text-orange-600"
                    : condition === "expired"
                    ? "text-red-600"
                    : "text-blue-600"
                }`}
              >
                {condition === "good"
                  ? "ปกติ"
                  : condition === "damaged"
                  ? "เสียหาย"
                  : condition === "expired"
                  ? "หมดอายุ"
                  : "คืนสินค้า"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">บาร์โค้ด:</span>
              <span className="font-mono text-xs">{product.barcode}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={quantity <= 0 || isLoading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
          >
            {isLoading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Save size={16} />
                บันทึกข้อมูล
              </>
            )}
          </button>

          {onCancel && (
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="px-4 py-3 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              ข้าม
            </button>
          )}
        </div>

        {/* Keyboard Shortcuts */}
        <div className="text-xs text-gray-500 text-center space-y-1">
          <div>⌨️ คีย์ลัด: Tab = ช่องถัดไป | Enter = บันทึก | Esc = ข้าม</div>
        </div>
      </div>
    </div>
  );
};
