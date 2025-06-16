// Path: src/components/product/InventoryAddSection.tsx - Complete Updated Version

"use client";

import React, { useState, useEffect } from "react";
import { Archive, Plus, Minus, Check } from "lucide-react";
import { Product } from "../../types/product";

interface InventoryAddSectionProps {
  product: Product;
  currentInventoryQuantity: number;
  onAddToInventory: (
    product: Product,
    quantity: number,
    barcodeType?: "ea" | "dsp" | "cs"
  ) => boolean;
  isVisible: boolean;
  barcodeType?: "ea" | "dsp" | "cs";
}

export const InventoryAddSection: React.FC<InventoryAddSectionProps> = ({
  product,
  currentInventoryQuantity,
  onAddToInventory,
  isVisible,
  barcodeType,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [inputValue, setInputValue] = useState("1");
  const [isAdding, setIsAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  // Reset states when visibility changes
  useEffect(() => {
    if (isVisible) {
      setQuantity(1);
      setInputValue("1");
      setAddSuccess(false);
    }
  }, [isVisible]);

  // ✅ Updated - Remove maximum limit validation
  const handleQuantityChange = (value: string) => {
    setInputValue(value); // อัพเดท input value ทันที

    if (value === "" || value === "0") {
      // อนุญาตให้เป็นว่างหรือ 0 ชั่วคราว
      return;
    }

    const numValue = parseInt(value);
    // ✅ เอาการเช็ค upper limit ออก - ให้กรอกได้ไม่จำกัด
    if (!isNaN(numValue) && numValue >= 1) {
      setQuantity(numValue);
    }
  };

  // ✅ Updated - Remove maximum limit validation
  const handleInputBlur = () => {
    // เมื่อผู้ใช้คลิกออกจาก input
    if (inputValue === "" || parseInt(inputValue) < 1) {
      setInputValue("1");
      setQuantity(1);
    } else {
      const numValue = parseInt(inputValue);
      // ✅ เอาการเช็ค upper limit ออก - ให้กรอกได้ไม่จำกัด
      if (!isNaN(numValue) && numValue >= 1) {
        const validValue = Math.max(1, numValue); // เอา Math.min(999, numValue) ออก
        setQuantity(validValue);
        setInputValue(validValue.toString());
      } else {
        setInputValue("1");
        setQuantity(1);
      }
    }
  };

  const handleInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleInputBlur();
    }
  };

  // ✅ Updated - Remove maximum limit
  const increaseQuantity = () => {
    // ✅ เอาการเช็ค quantity < 999 ออก - ให้เพิ่มได้ไม่จำกัด
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

  const handleAddToInventory = async () => {
    // ตรวจสอบค่า quantity ก่อนเพิ่ม
    const finalQuantity =
      inputValue === "" || parseInt(inputValue) < 1 ? 1 : quantity;

    console.log("🔘 InventoryAddSection calling onAddToInventory:");
    console.log("  📦 Product:", product.name);
    console.log("  🔢 Quantity:", finalQuantity);
    console.log("  🏷️ BarcodeType:", barcodeType);

    setIsAdding(true);
    try {
      const success = onAddToInventory(product, finalQuantity, barcodeType);

      if (success) {
        setAddSuccess(true);
        setQuantity(1);
        setInputValue("1");

        setTimeout(() => {
          setAddSuccess(false);
        }, 3000);

        const unitText = barcodeType === "cs" ? "ลัง" : "ชิ้น";
        console.log(
          `✅ Added ${finalQuantity} ${unitText} (${barcodeType || "ea"}) of ${
            product.name
          } to inventory`
        );
      }
    } catch (error) {
      console.error("❌ Failed to add to inventory:", error);
    } finally {
      setIsAdding(false);
    }
  };

  if (!isVisible) return null;

  // ตรวจสอบว่าสามารถเพิ่มได้หรือไม่
  const canAdd = inputValue !== "" && parseInt(inputValue) >= 1;

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
            <p className="text-green-600 text-sm">
              เพิ่ม {product.name} จำนวน {quantity} {product.unit || "ชิ้น"}{" "}
              แล้ว
            </p>
          </div>
        </div>
      )}

      {/* Add to Inventory Section */}
      <div className="bg-gradient-to-r from-fn-green/10 to-fn-red/10 border border-fn-green/30 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="bg-fn-green/20 p-2 rounded-lg">
            <Archive size={16} className="fn-green" />
          </div>
          <span className="text-lg font-semibold text-gray-800">
            เพิ่มเข้า Inventory
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Quantity Controls */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 min-w-[60px]">จำนวน:</span>
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={decreaseQuantity}
                disabled={quantity <= 1 || isAdding}
                className="bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 px-3 py-2 transition-colors"
              >
                <Minus size={16} />
              </button>
              <input
                type="number"
                value={inputValue}
                onChange={(e) => handleQuantityChange(e.target.value)}
                onBlur={handleInputBlur}
                onKeyPress={handleInputKeyPress}
                min="1"
                // ✅ เอา max="999" ออก - ให้กรอกได้ไม่จำกัด
                disabled={isAdding}
                className="w-20 text-center py-2 border-none outline-none bg-white text-gray-900 font-medium disabled:bg-gray-50"
                // ✅ เพิ่ม width เป็น w-20 เพื่อรองรับตัวเลขที่มากขึ้น
                placeholder="จำนวน"
              />
              <button
                onClick={increaseQuantity}
                // ✅ เอา disabled={quantity >= 999 || isAdding} ออก - ให้เพิ่มได้ไม่จำกัด
                disabled={isAdding}
                className="bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 px-3 py-2 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
            <span className="text-sm text-gray-600">
              {product.unit || "ชิ้น"}
            </span>
          </div>

          {/* Add to Inventory Button */}
          <button
            onClick={handleAddToInventory}
            disabled={isAdding || addSuccess || !canAdd}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 font-medium shadow-lg transform ml-auto border ${
              addSuccess
                ? "bg-green-100 text-green-700 border-green-200 cursor-not-allowed"
                : isAdding || !canAdd
                ? "bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed"
                : "bg-fn-green hover:bg-fn-green/90 text-white border-fn-green hover:shadow-xl hover:scale-105"
            }`}
          >
            {isAdding ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>กำลังเพิ่ม...</span>
              </>
            ) : addSuccess ? (
              <>
                <Check size={16} />
                <span>เพิ่มแล้ว</span>
              </>
            ) : (
              <>
                <Plus size={16} />
                <span>เพิ่มเข้า Inventory</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
