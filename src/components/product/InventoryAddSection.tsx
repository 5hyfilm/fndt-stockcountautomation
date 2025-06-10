// src/components/product/InventoryAddSection.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Archive, Plus, Minus, Check } from "lucide-react";
import { Product } from "../../types/product";

interface InventoryAddSectionProps {
  product: Product;
  currentInventoryQuantity: number;
  onAddToInventory: (product: Product, quantity: number) => boolean;
  isVisible: boolean;
}

export const InventoryAddSection: React.FC<InventoryAddSectionProps> = ({
  product,
  currentInventoryQuantity,
  onAddToInventory,
  isVisible,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  // Reset states when visibility changes
  useEffect(() => {
    if (isVisible) {
      setQuantity(1);
      setAddSuccess(false);
    }
  }, [isVisible]);

  const handleQuantityChange = (value: number) => {
    if (value >= 1 && value <= 999) {
      setQuantity(value);
    }
  };

  const increaseQuantity = () => {
    if (quantity < 999) {
      setQuantity(quantity + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleAddToInventory = async () => {
    setIsAdding(true);
    try {
      const success = onAddToInventory(product, quantity);

      if (success) {
        setAddSuccess(true);
        setQuantity(1);

        // แสดงข้อความสำเร็จชั่วคราว
        setTimeout(() => {
          setAddSuccess(false);
        }, 3000);

        console.log(`✅ Added ${quantity} ${product.name} to inventory`);
      }
    } catch (error) {
      console.error("❌ Failed to add to inventory:", error);
    } finally {
      setIsAdding(false);
    }
  };

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
                value={quantity}
                onChange={(e) =>
                  handleQuantityChange(parseInt(e.target.value) || 1)
                }
                min="1"
                max="999"
                disabled={isAdding}
                className="w-16 text-center py-2 border-none outline-none bg-white text-gray-900 font-medium disabled:bg-gray-50"
              />
              <button
                onClick={increaseQuantity}
                disabled={quantity >= 999 || isAdding}
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
            disabled={isAdding || addSuccess}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 font-medium shadow-lg transform ml-auto border ${
              addSuccess
                ? "bg-green-100 text-green-700 border-green-200 cursor-not-allowed"
                : isAdding
                ? "bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed"
                : "bg-fn-green hover:bg-fn-green/90 text-white border-fn-green hover:shadow-xl hover:scale-105"
            }`}
          >
            {isAdding ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                <span>กำลังเพิ่ม...</span>
              </>
            ) : addSuccess ? (
              <>
                <Check size={16} />
                <span>เพิ่มแล้ว</span>
              </>
            ) : (
              <>
                <Archive size={16} />
                <span>เพิ่มเข้า Stock</span>
              </>
            )}
          </button>
        </div>

        {/* Current inventory display */}
        {currentInventoryQuantity > 0 && (
          <div className="mt-3 text-sm text-gray-600 bg-blue-50 p-2 rounded">
            📦 ปัจจุบันใน Stock: {currentInventoryQuantity} {"ชิ้น"}
            {quantity > 0 && (
              <span className="text-blue-600 font-medium">
                → จะเป็น {currentInventoryQuantity + quantity} {"ชิ้น"}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
