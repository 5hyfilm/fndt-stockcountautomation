// src/data/products.ts
import { Product, ProductCategory, ProductStatus } from "../types/product";

export const MOCK_PRODUCTS: Product[] = [
  // F&N Beverages
  {
    id: "1",
    barcode: "3337875597395",
    name: "Cerave",
    name_en: "F&N Orange",
    category: ProductCategory.BEVERAGES,
    brand: "F&N",
    description: "น้ำส้มผสมคาร์บอเนตรสชาติหวานเปรื้อย",
    size: "325ml",
    unit: "กระป๋อง",
    price: 12.0,
    currency: "THB",
    sku: "FN-ORA-325",
    nutrition_info: {
      serving_size: "325ml",
      calories_per_serving: 140,
      carbohydrates: 35,
      sugar: 34,
      sodium: 10,
      vitamin_c: 25,
    },
    ingredients: ["น้ำ", "น้ำตาลทราย", "กรดซิตริก", "วิตามินซี", "สีธรรมชาติ"],
    allergens: [],
    storage_instructions: "เก็บในที่แห้ง เย็น หลีกเลี่ยงแสงแดด",
    country_of_origin: "ไทย",
    barcode_type: "EAN-13",
    image_url: "/products/fn-orange.jpg",
    status: ProductStatus.ACTIVE,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    barcode: "8850643000125",
    name: "เอฟแอนเอ็น น้ำเขียว",
    name_en: "F&N Green",
    category: ProductCategory.BEVERAGES,
    brand: "F&N",
    description: "น้ำหวานผสมคาร์บอเนตรสไลม์",
    size: "325ml",
    unit: "กระป๋อง",
    price: 12.0,
    currency: "THB",
    sku: "FN-GRN-325",
    nutrition_info: {
      serving_size: "325ml",
      calories_per_serving: 135,
      carbohydrates: 34,
      sugar: 33,
      sodium: 8,
    },
    ingredients: ["น้ำ", "น้ำตาลทราย", "กรดซิตริก", "วิตามินซี", "สีธรรมชาติ"],
    allergens: [],
    storage_instructions: "เก็บในที่แห้ง เย็น หลีกเลี่ยงแสงแดด",
    country_of_origin: "ไทย",
    barcode_type: "EAN-13",
    image_url: "/products/fn-green.jpg",
    status: ProductStatus.ACTIVE,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "3",
    barcode: "8850643000132",
    name: "เอฟแอนเอ็น น้ำแดง",
    name_en: "F&N Red",
    category: ProductCategory.BEVERAGES,
    brand: "F&N",
    description: "น้ำหวานผสมคาร์บอเนตรสสตรอเบอรี่",
    size: "325ml",
    unit: "กระป๋อง",
    price: 12.0,
    currency: "THB",
    sku: "FN-RED-325",
    nutrition_info: {
      serving_size: "325ml",
      calories_per_serving: 142,
      carbohydrates: 36,
      sugar: 35,
      sodium: 9,
    },
    ingredients: [
      "น้ำ",
      "น้ำตาลทราย",
      "กรดซิตริก",
      "สีธรรมชาติ",
      "กลิ่นธรรมชาติ",
    ],
    allergens: [],
    storage_instructions: "เก็บในที่แห้ง เย็น หลีกเลี่ยงแสงแดด",
    country_of_origin: "ไทย",
    barcode_type: "EAN-13",
    image_url: "/products/fn-red.jpg",
    status: ProductStatus.ACTIVE,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  // ICE COOL
  {
    id: "4",
    barcode: "8850643000149",
    name: "ไอซ์คูล น้ำใส",
    name_en: "ICE COOL Clear",
    category: ProductCategory.BEVERAGES,
    brand: "ICE COOL",
    description: "น้ำดื่มบริสุทธิ์ผ่านการฆ่าเชื้อด้วยรังสี UV",
    size: "600ml",
    unit: "ขวด",
    price: 8.0,
    currency: "THB",
    sku: "IC-CLR-600",
    nutrition_info: {
      serving_size: "600ml",
      calories_per_serving: 0,
      carbohydrates: 0,
      sugar: 0,
      sodium: 2,
    },
    ingredients: ["น้ำบริสุทธิ์"],
    allergens: [],
    storage_instructions: "เก็บในที่เย็น",
    country_of_origin: "ไทย",
    barcode_type: "EAN-13",
    image_url: "/products/icecool-clear.jpg",
    status: ProductStatus.ACTIVE,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  // Snacks
  {
    id: "5",
    barcode: "8850643001001",
    name: "ขนมปังแซนด์วิช",
    name_en: "F&N Sandwich Bread",
    category: ProductCategory.BAKERY,
    brand: "F&N",
    description: "ขนมปังแซนด์วิชนุ่มหอม",
    size: "350g",
    unit: "ถุง",
    price: 35.0,
    currency: "THB",
    sku: "FN-BRD-350",
    nutrition_info: {
      serving_size: "2 แผ่น (60g)",
      calories_per_serving: 160,
      protein: 5,
      carbohydrates: 30,
      sugar: 3,
      fat: 3,
      saturated_fat: 1,
      sodium: 320,
      fiber: 2,
    },
    ingredients: ["แป้งสาลี", "น้ำ", "น้ำตาล", "ยีสต์", "เกลือ", "น้ำมันปาล์ม"],
    allergens: ["ข้าวสาลี", "อาจมีไข่", "อาจมีนม"],
    storage_instructions: "เก็บในที่แห้ง อุณหภูมิห้อง",
    country_of_origin: "ไทย",
    barcode_type: "EAN-13",
    image_url: "/products/fn-bread.jpg",
    status: ProductStatus.ACTIVE,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  // Canned Food
  {
    id: "6",
    barcode: "8850643002001",
    name: "ปลาซาร์ดีนในซอสมะเขือเทศ",
    name_en: "F&N Sardines in Tomato Sauce",
    category: ProductCategory.CANNED_FOOD,
    brand: "F&N",
    description: "ปลาซาร์ดีนคุณภาพดีในซอสมะเขือเทศรสเข้มข้น",
    size: "155g",
    unit: "กระป๋อง",
    price: 25.0,
    currency: "THB",
    sku: "FN-SAR-155",
    nutrition_info: {
      serving_size: "155g",
      calories_per_serving: 180,
      protein: 20,
      carbohydrates: 8,
      sugar: 6,
      fat: 8,
      saturated_fat: 2,
      sodium: 450,
      calcium: 150,
    },
    ingredients: [
      "ปลาซาร์ดีน",
      "น้ำ",
      "มะเขือเทศ",
      "น้ำตาล",
      "เกลือ",
      "สมุนไพร",
    ],
    allergens: ["ปลา"],
    storage_instructions: "เก็บในที่แห้ง เย็น หลังเปิดควรบริโภคทันที",
    country_of_origin: "ไทย",
    barcode_type: "EAN-13",
    image_url: "/products/fn-sardines.jpg",
    status: ProductStatus.ACTIVE,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  // Test barcodes (สำหรับทดสอบ)
  {
    id: "7",
    barcode: "1234567890123",
    name: "สินค้าทดสอบ A",
    name_en: "Test Product A",
    category: ProductCategory.OTHER,
    brand: "TEST",
    description: "สินค้าสำหรับทดสอบระบบ",
    size: "100g",
    unit: "ชิ้น",
    price: 10.0,
    currency: "THB",
    sku: "TEST-A-100",
    status: ProductStatus.ACTIVE,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "8",
    barcode: "9876543210987",
    name: "สินค้าทดสอบ B",
    name_en: "Test Product B",
    category: ProductCategory.OTHER,
    brand: "TEST",
    description: "สินค้าสำหรับทดสอบระบบ",
    size: "200g",
    unit: "ชิ้น",
    price: 20.0,
    currency: "THB",
    sku: "TEST-B-200",
    status: ProductStatus.ACTIVE,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
];

// Helper functions
export const findProductByBarcode = (barcode: string): Product | undefined => {
  return MOCK_PRODUCTS.find((product) => product.barcode === barcode);
};

export const searchProducts = (params: {
  name?: string;
  category?: ProductCategory;
  brand?: string;
  status?: ProductStatus;
}): Product[] => {
  return MOCK_PRODUCTS.filter((product) => {
    if (
      params.name &&
      !product.name.toLowerCase().includes(params.name.toLowerCase()) &&
      !product.name_en?.toLowerCase().includes(params.name.toLowerCase())
    ) {
      return false;
    }
    if (params.category && product.category !== params.category) {
      return false;
    }
    if (params.brand && product.brand !== params.brand) {
      return false;
    }
    if (params.status && product.status !== params.status) {
      return false;
    }
    return true;
  });
};

export const getProductsByCategory = (category: ProductCategory): Product[] => {
  return MOCK_PRODUCTS.filter((product) => product.category === category);
};

export const getAllBrands = (): string[] => {
  return [...new Set(MOCK_PRODUCTS.map((product) => product.brand))];
};

export const getProductStats = () => {
  const totalProducts = MOCK_PRODUCTS.length;
  const activeProducts = MOCK_PRODUCTS.filter(
    (p) => p.status === ProductStatus.ACTIVE
  ).length;
  const categories = [...new Set(MOCK_PRODUCTS.map((p) => p.category))].length;
  const brands = getAllBrands().length;

  return {
    totalProducts,
    activeProducts,
    categories,
    brands,
  };
};
