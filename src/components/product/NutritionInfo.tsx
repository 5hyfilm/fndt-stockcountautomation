// src/components/product/NutritionInfo.tsx
"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Product } from "../../types/product";

interface NutritionInfoProps {
  product: Product;
}

export const NutritionInfo: React.FC<NutritionInfoProps> = ({ product }) => {
  const [showNutrition, setShowNutrition] = useState(false);

  // ✅ Fix: ใช้ product.nutrition แทน product.nutrition_info
  if (!product.nutrition) return null;

  const nutritionData = [
    {
      label: "แคลอรี่",
      value: product.nutrition.calories, // ✅ Fix: calories แทน calories_per_serving
      unit: "kcal",
    },
    {
      label: "โปรตีน",
      value: product.nutrition.protein, // ✅ ใช้ได้เลย
      unit: "g",
    },
    {
      label: "คาร์โบไหเดรต",
      value: product.nutrition.totalCarbohydrate, // ✅ Fix: totalCarbohydrate แทน carbohydrates
      unit: "g",
    },
    {
      label: "น้ำตาล",
      value: product.nutrition.totalSugars, // ✅ Fix: totalSugars แทน sugar
      unit: "g",
    },
    {
      label: "ไขมัน",
      value: product.nutrition.totalFat, // ✅ Fix: totalFat แทน fat
      unit: "g",
    },
    {
      label: "โซเดียม",
      value: product.nutrition.sodium, // ✅ ใช้ได้เลย
      unit: "mg",
    },
  ].filter((item) => item.value !== undefined && item.value !== null);

  return (
    <div className="space-y-3">
      {/* Toggle Button */}
      <button
        onClick={() => setShowNutrition(!showNutrition)}
        className="w-full flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
      >
        <span className="text-sm font-medium text-green-700">
          ข้อมูลโภชนาการ
        </span>
        {showNutrition ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {/* Nutrition Content */}
      {showNutrition && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {/* Serving Size */}
            {product.nutrition.servingSize && ( // ✅ Fix: servingSize แทน serving_size
              <div className="col-span-2 text-center border-b border-green-200 pb-2 mb-2">
                <span className="font-medium">
                  ขนาดบริโภค: {product.nutrition.servingSize}
                </span>
              </div>
            )}

            {/* Nutrition Data */}
            {nutritionData.map((item, index) => (
              <div key={index} className="flex justify-between">
                <span>{item.label}:</span>
                <span className="font-medium">
                  {item.value} {item.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
