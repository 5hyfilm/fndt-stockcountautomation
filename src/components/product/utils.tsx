// src/components/product/utils.tsx
import { Product, ProductCategory, NutritionInfo } from "../../types/product";
import {
  Package,
  Coffee,
  Utensils,
  Droplets,
  Heart,
  Home,
  HelpCircle,
} from "lucide-react";

// ✅ Map ข้อมูลสินค้าเก่าให้เข้ากับ ProductCategory ใหม่
function mapLegacyToNewCategory(legacyCategory: string): ProductCategory {
  // Map legacy categories to new consolidated categories
  const legacyMapping: Record<string, ProductCategory> = {
    // Beverage mappings
    STM: ProductCategory.BEVERAGE,
    BB_GOLD: ProductCategory.BEVERAGE,
    EVAP: ProductCategory.BEVERAGE,
    SBC: ProductCategory.BEVERAGE,
    SCM: ProductCategory.BEVERAGE,
    MAGNOLIA_UHT: ProductCategory.BEVERAGE,
    NUTRISOY: ProductCategory.BEVERAGE,
    BEVERAGES: ProductCategory.BEVERAGE,
    DAIRY: ProductCategory.BEVERAGE,

    // Snack mappings
    GUMMY: ProductCategory.SNACK,
    SNACKS: ProductCategory.SNACK,
    CONFECTIONERY: ProductCategory.SNACK,

    // Food mappings
    CANNED_FOOD: ProductCategory.FOOD,
    BAKERY: ProductCategory.FOOD,
    INSTANT_NOODLES: ProductCategory.FOOD,
    SAUCES: ProductCategory.FOOD,
    SEASONING: ProductCategory.FOOD,
    FROZEN: ProductCategory.FOOD,

    // Other mappings
    PERSONAL_CARE: ProductCategory.PERSONAL_CARE,
    HOUSEHOLD: ProductCategory.HOUSEHOLD,
    HEALTH: ProductCategory.HEALTH,
  };

  return legacyMapping[legacyCategory] || ProductCategory.OTHER;
}

// ✅ Updated to use consolidated ProductCategory
export const getCategoryIcon = (category: ProductCategory | string) => {
  // Handle legacy categories by mapping them first
  const normalizedCategory =
    typeof category === "string" ? mapLegacyToNewCategory(category) : category;

  switch (normalizedCategory) {
    case ProductCategory.BEVERAGE:
      return <Coffee size={16} className="text-blue-500" />;
    case ProductCategory.SNACK:
      return <Package size={16} className="text-orange-500" />;
    case ProductCategory.FOOD:
      return <Utensils size={16} className="text-green-500" />;
    case ProductCategory.PERSONAL_CARE:
      return <Droplets size={16} className="text-pink-500" />;
    case ProductCategory.HOUSEHOLD:
      return <Home size={16} className="text-purple-500" />;
    case ProductCategory.HEALTH:
      return <Heart size={16} className="text-red-500" />;
    default:
      return <HelpCircle size={16} className="text-gray-500" />;
  }
};

// ✅ Updated to use consolidated ProductCategory
export const getCategoryColor = (category: ProductCategory | string) => {
  // Handle legacy categories by mapping them first
  const normalizedCategory =
    typeof category === "string" ? mapLegacyToNewCategory(category) : category;

  switch (normalizedCategory) {
    case ProductCategory.BEVERAGE:
      return "bg-blue-100 text-blue-800 border-blue-200";
    case ProductCategory.SNACK:
      return "bg-orange-100 text-orange-800 border-orange-200";
    case ProductCategory.FOOD:
      return "bg-green-100 text-green-800 border-green-200";
    case ProductCategory.PERSONAL_CARE:
      return "bg-pink-100 text-pink-800 border-pink-200";
    case ProductCategory.HOUSEHOLD:
      return "bg-purple-100 text-purple-800 border-purple-200";
    case ProductCategory.HEALTH:
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

// ✅ Updated to use consolidated ProductCategory with Thai translations
export const getCategoryDisplayName = (
  category: ProductCategory | string
): string => {
  // Handle legacy categories by mapping them first
  const normalizedCategory =
    typeof category === "string" ? mapLegacyToNewCategory(category) : category;

  switch (normalizedCategory) {
    case ProductCategory.BEVERAGE:
      return "เครื่องดื่ม";
    case ProductCategory.SNACK:
      return "ขนมขบเคี้ยว";
    case ProductCategory.FOOD:
      return "อาหาร";
    case ProductCategory.PERSONAL_CARE:
      return "ผลิตภัณฑ์ดูแลผิว";
    case ProductCategory.HOUSEHOLD:
      return "ของใช้ในบ้าน";
    case ProductCategory.HEALTH:
      return "สุขภาพ";
    default:
      return "อื่นๆ";
  }
};

// ✅ Updated nutrition data formatter using consolidated NutritionInfo
export const formatNutritionValue = (
  nutrition: NutritionInfo,
  key: keyof NutritionInfo,
  unit: string = ""
): string | null => {
  const value = nutrition[key];
  if (value === undefined || value === null) return null;
  return `${value}${unit}`;
};

// ✅ Updated nutrition display helper using correct field names
export const getNutritionDisplayItems = (nutrition: NutritionInfo) => {
  return [
    {
      label: "แคลอรี่",
      value: nutrition.calories, // ✅ Fix: calories แทน calories_per_serving
      unit: "kcal",
    },
    {
      label: "โปรตีน",
      value: nutrition.protein,
      unit: "g",
    },
    {
      label: "คาร์โบไหเดรต",
      value: nutrition.totalCarbohydrate, // ✅ Fix: totalCarbohydrate แทน carbohydrates
      unit: "g",
    },
    {
      label: "น้ำตาล",
      value: nutrition.totalSugars, // ✅ Fix: totalSugars แทน sugar
      unit: "g",
    },
    {
      label: "ไขมัน",
      value: nutrition.totalFat, // ✅ Fix: totalFat แทน fat
      unit: "g",
    },
    {
      label: "ไขมันอิ่มตัว",
      value: nutrition.saturatedFat, // ✅ Fix: saturatedFat แทน saturated_fat
      unit: "g",
    },
    {
      label: "โซเดียม",
      value: nutrition.sodium,
      unit: "mg",
    },
    {
      label: "ใยอาหาร",
      value: nutrition.dietaryFiber, // ✅ Fix: dietaryFiber แทน fiber
      unit: "g",
    },
    {
      label: "วิตามินดี",
      value: nutrition.vitaminD, // ✅ Fix: vitaminD แทน vitamin_c
      unit: "mcg",
    },
    {
      label: "แคลเซียม",
      value: nutrition.calcium,
      unit: "mg",
    },
    {
      label: "เหล็ก",
      value: nutrition.iron,
      unit: "mg",
    },
    {
      label: "โปแตสเซียม",
      value: nutrition.potassium,
      unit: "mg",
    },
  ].filter((item) => item.value !== undefined && item.value !== null);
};

// ✅ Check if product has nutritional information
export const hasNutritionInfo = (product: Product): boolean => {
  return !!(
    product.nutrition &&
    Object.values(product.nutrition).some(
      (value) => value !== undefined && value !== null
    )
  ); // ✅ Fix: nutrition แทน nutrition_info
};

// ✅ Format product price with currency
export const formatPrice = (
  product: Product,
  showCurrency: boolean = true
): string => {
  if (!product.price) return "ราคาไม่ระบุ";

  const formattedPrice = product.price.toLocaleString("th-TH");
  const currency = product.currency || "THB";

  if (!showCurrency || currency === "THB") {
    return `฿${formattedPrice}`;
  }

  return `${formattedPrice} ${currency}`;
};

// ✅ Format product status in Thai
export const formatProductStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    active: "ใช้งาน",
    inactive: "ไม่ใช้งาน",
    discontinued: "หยุดผลิต",
    out_of_stock: "หมดสต็อก",
    pending: "รอดำเนินการ",
  };

  return statusMap[status] || status;
};

// ✅ Get product status color
export const getProductStatusColor = (status: string): string => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800 border-green-200";
    case "inactive":
      return "bg-red-100 text-red-800 border-red-200";
    case "discontinued":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "out_of_stock":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "pending":
      return "bg-blue-100 text-blue-800 border-blue-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

// ✅ Format serving size display
export const formatServingSize = (servingSize?: string): string => {
  if (!servingSize) return "ไม่ระบุ";
  return servingSize;
};

// ✅ Check if product has complete information
export const isCompleteProduct = (product: Product): boolean => {
  return !!(
    product.productName &&
    product.brand &&
    product.category &&
    product.barcode &&
    product.materialCode
  );
};

// ✅ Generate product display summary
export const getProductSummary = (product: Product): string => {
  const parts: string[] = [];

  if (product.brand) parts.push(product.brand);
  if (product.size) parts.push(product.size);
  if (product.unit) parts.push(product.unit);

  return parts.join(" | ") || "ไม่มีข้อมูลเพิ่มเติม";
};

// ✅ Format quantity with proper units
export const formatQuantity = (quantity: number, unit?: string): string => {
  if (!quantity && quantity !== 0) return "0";

  const formattedQuantity = quantity.toLocaleString("th-TH");

  if (!unit) return formattedQuantity;

  // Thai unit translations
  const unitTranslations: Record<string, string> = {
    piece: "ชิ้น",
    pieces: "ชิ้น",
    pcs: "ชิ้น",
    ea: "ชิ้น",
    bottle: "ขวด",
    bottles: "ขวด",
    can: "กระป๋อง",
    cans: "กระป๋อง",
    pack: "แพ็ค",
    packs: "แพ็ค",
    dsp: "แพ็ค",
    box: "กล่อง",
    boxes: "กล่อง",
    case: "ลัง",
    cases: "ลัง",
    cs: "ลัง",
    kg: "กิโลกรัม",
    g: "กรัม",
    l: "ลิตร",
    ml: "มิลลิลิตร",
    litre: "ลิตร",
    liter: "ลิตร",
    gram: "กรัม",
    kilogram: "กิโลกรัม",
  };

  const translatedUnit = unitTranslations[unit.toLowerCase()] || unit;

  return `${formattedQuantity} ${translatedUnit}`;
};
