// src/components/product/utils.ts - Product Component Utilities
import { Coffee, Package } from "lucide-react";
import { ProductCategory } from "../../types/product";
import { CategoryStyling, NutritionItem } from "./types";

/**
 * Get category icon based on product category
 */
export const getCategoryIcon = (category: ProductCategory) => {
  switch (category) {
    case ProductCategory.BEVERAGES:
      return <Coffee size={16} className="text-blue-500" />;
    case ProductCategory.SNACKS:
      return <Package size={16} className="text-orange-500" />;
    case ProductCategory.DAIRY:
      return <Package size={16} className="text-yellow-500" />;
    case ProductCategory.CANNED_FOOD:
      return <Package size={16} className="text-green-500" />;
    case ProductCategory.BAKERY:
      return <Package size={16} className="text-amber-500" />;
    case ProductCategory.CONFECTIONERY:
      return <Package size={16} className="text-pink-500" />;
    case ProductCategory.INSTANT_NOODLES:
      return <Package size={16} className="text-red-500" />;
    case ProductCategory.SAUCES:
      return <Package size={16} className="text-purple-500" />;
    case ProductCategory.SEASONING:
      return <Package size={16} className="text-indigo-500" />;
    case ProductCategory.FROZEN:
      return <Package size={16} className="text-cyan-500" />;
    default:
      return <Package size={16} className="text-gray-500" />;
  }
};

/**
 * Get category color classes based on product category
 */
export const getCategoryColor = (category: ProductCategory): string => {
  switch (category) {
    case ProductCategory.BEVERAGES:
      return "bg-blue-50 text-blue-800 border-blue-200";
    case ProductCategory.SNACKS:
      return "bg-orange-50 text-orange-800 border-orange-200";
    case ProductCategory.DAIRY:
      return "bg-yellow-50 text-yellow-800 border-yellow-200";
    case ProductCategory.CANNED_FOOD:
      return "bg-green-50 text-green-800 border-green-200";
    case ProductCategory.BAKERY:
      return "bg-amber-50 text-amber-800 border-amber-200";
    case ProductCategory.CONFECTIONERY:
      return "bg-pink-50 text-pink-800 border-pink-200";
    case ProductCategory.INSTANT_NOODLES:
      return "bg-orange-50 text-orange-800 border-orange-200";
    case ProductCategory.SAUCES:
      return "bg-red-50 text-red-800 border-red-200";
    case ProductCategory.SEASONING:
      return "bg-yellow-50 text-yellow-800 border-yellow-200";
    case ProductCategory.FROZEN:
      return "bg-cyan-50 text-cyan-800 border-cyan-200";
    default:
      return "bg-gray-50 text-gray-800 border-gray-200";
  }
};

/**
 * Get complete category styling (icon + colors)
 */
export const getCategoryStyling = (
  category: ProductCategory
): CategoryStyling => {
  return {
    icon: getCategoryIcon(category),
    colorClass: getCategoryColor(category),
  };
};

/**
 * Format nutrition data for display
 */
export const formatNutritionData = (nutritionInfo: any): NutritionItem[] => {
  if (!nutritionInfo) return [];

  return [
    {
      label: "แคลอรี่",
      value: nutritionInfo.calories_per_serving,
      unit: "kcal",
    },
    {
      label: "โปรตีน",
      value: nutritionInfo.protein,
      unit: "g",
    },
    {
      label: "คาร์โบไหเดรต",
      value: nutritionInfo.carbohydrates,
      unit: "g",
    },
    {
      label: "น้ำตาล",
      value: nutritionInfo.sugar,
      unit: "g",
    },
    {
      label: "ไขมัน",
      value: nutritionInfo.fat,
      unit: "g",
    },
    {
      label: "ไขมันอิ่มตัว",
      value: nutritionInfo.saturated_fat,
      unit: "g",
    },
    {
      label: "โซเดียม",
      value: nutritionInfo.sodium,
      unit: "mg",
    },
    {
      label: "ไฟเบอร์",
      value: nutritionInfo.fiber,
      unit: "g",
    },
    {
      label: "วิตามินซี",
      value: nutritionInfo.vitamin_c,
      unit: "mg",
    },
    {
      label: "แคลเซียม",
      value: nutritionInfo.calcium,
      unit: "mg",
    },
  ].filter((item) => item.value !== undefined && item.value !== null);
};

/**
 * Format price for display
 */
export const formatPrice = (
  price: number | undefined,
  currency: string = "THB"
): string => {
  if (!price) return "";

  switch (currency) {
    case "THB":
      return `฿${price.toFixed(2)}`;
    case "USD":
      return `$${price.toFixed(2)}`;
    default:
      return `${price.toFixed(2)} ${currency}`;
  }
};

/**
 * Format quantity with unit
 */
export const formatQuantity = (quantity: number, unit?: string): string => {
  return `${quantity} ${unit || "ชิ้น"}`;
};

/**
 * Check if product has detailed information
 */
export const hasProductDetails = (product: any): boolean => {
  return !!(
    product.sku ||
    product.country_of_origin ||
    product.storage_instructions ||
    (product.ingredients && product.ingredients.length > 0) ||
    (product.allergens && product.allergens.length > 0)
  );
};

/**
 * Check if product has nutrition information
 */
export const hasNutritionInfo = (product: any): boolean => {
  return !!(
    product.nutrition_info &&
    formatNutritionData(product.nutrition_info).length > 0
  );
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      return true;
    } catch (fallbackErr) {
      console.error("Failed to copy text:", fallbackErr);
      return false;
    }
  }
};

/**
 * Validate quantity input
 */
export const validateQuantity = (
  value: number,
  min: number = 1,
  max: number = 999
): number => {
  if (isNaN(value) || value < min) return min;
  if (value > max) return max;
  return Math.floor(value);
};

/**
 * Generate product display name
 */
export const getDisplayName = (product: any): string => {
  return product.name || product.name_en || "ไม่ระบุชื่อสินค้า";
};

/**
 * Generate product subtitle
 */
export const getProductSubtitle = (product: any): string => {
  const parts = [];

  if (product.brand) parts.push(product.brand);
  if (product.size && product.unit)
    parts.push(`${product.size} ${product.unit}`);
  if (product.category) parts.push(product.category);

  return parts.join(" • ");
};
