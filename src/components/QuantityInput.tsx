// src/components/QuantityInput.tsx
"use client";

import React, { useState, useCallback } from "react";
import {
  Plus,
  Minus,
  Save,
  Package,
  Check,
  AlertCircle,
  Calculator,
} from "lucide-react";
import { Product } from "../types/product";

interface QuantityInputProps {
  product: Product;
  onSave: (quantity: number, unit: string, notes?: string) => void;
  isLoading?: boolean;
  defaultQuantity?: number;
}

export const QuantityInput: React.FC<QuantityInputProps> = ({
  product,
  onSave,
  isLoading = false,
  defaultQuantity = 1,
}) => {
  const [quantity, setQuantity] = useState<number>(defaultQuantity);
  const [notes, setNotes] = useState<string>("");
  const [selectedUnit, setSelectedUnit] = useState<string>("ea");
  const [showSuccess, setShowSuccess] = useState(false);

  // Unit options based on barcode types
  const unitOptions = [
    {
      value: "ea",
      label: "ชิ้น (Each)",
      icon: Package,
      description: "นับตามชิ้นย่อย",
      available: !!product.barcodes?.ea,
    },
    {
      value: "dsp",
      label: "แพ็ค (Display Pack)",
      icon: Package,
      description: "นับตามแพ็คจัดแสดง",
      available: !!product.barcodes?.dsp,
    },
    {
      value: "cs",
      label: "ลัง (Case/Carton)",
      icon: Package,
      description: "นับตามลัง/กล่องใหญ่",
      available: !!product.barcodes?.cs,
    },
  ].filter((option) => option.available);

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
      onSave(quantity, selectedUnit, notes);
      setShowSuccess(true);

      // Reset form after save
      setTimeout(() => {
        setQuantity(defaultQuantity);
        setNotes("");
        setShowSuccess(false);
      }, 1500);
    }
  }, [quantity, selectedUnit, notes, onSave, defaultQuantity]);

  const handleQuickQuantity = (value: number) => {
    setQuantity(value);
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
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
            <Calculator size={20} />
          </div>
          <div>
            <h3 className="font-semibold">บันทึกจำนวน</h3>
            <p className="text-blue-100 text-sm">{product.name}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
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
                    onChange={(e) => setSelectedUnit(e.target.value)}
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

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            หมายเหตุ (ไม่บังคับ):
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="เช่น สภาพสินค้า, ตำแหน่งจัดเก็บ, หรือข้อมูลเพิ่มเติม..."
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
              <span className="text-gray-600">บาร์โค้ด:</span>
              <span className="font-mono text-xs">{product.barcode}</span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={quantity <= 0 || isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
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
      </div>
    </div>
  );
};
