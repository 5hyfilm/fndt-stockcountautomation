export interface Product {
  id: string;
  barcode: string;
  name: string;
  name_en?: string;
  category: ProductCategory;
  brand: string;
  description?: string;
  size?: string;
  unit?: string;
  price?: number;
  currency?: string;
  sku?: string;
  batch_number?: string;
  expiry_date?: string;
  manufacturing_date?: string;
  nutrition_info?: NutritionInfo;
  ingredients?: string[];
  allergens?: string[];
  storage_instructions?: string;
  country_of_origin?: string;
  barcode_type?: string;
  image_url?: string;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
}

export interface NutritionInfo {
  serving_size?: string;
  calories_per_serving?: number;
  protein?: number;
  carbohydrates?: number;
  sugar?: number;
  fat?: number;
  saturated_fat?: number;
  sodium?: number;
  fiber?: number;
  vitamin_c?: number;
  calcium?: number;
}

export enum ProductCategory {
  BEVERAGES = "beverages",
  DAIRY = "dairy",
  SNACKS = "snacks",
  CANNED_FOOD = "canned_food",
  INSTANT_NOODLES = "instant_noodles",
  SAUCES = "sauces",
  SEASONING = "seasoning",
  FROZEN = "frozen",
  BAKERY = "bakery",
  CONFECTIONERY = "confectionery",
  OTHER = "other",
}

export enum ProductStatus {
  ACTIVE = "active",
  DISCONTINUED = "discontinued",
  OUT_OF_STOCK = "out_of_stock",
  PENDING = "pending",
}

export interface ProductSearchParams {
  barcode?: string;
  name?: string;
  category?: ProductCategory;
  brand?: string;
  status?: ProductStatus;
  limit?: number;
  offset?: number;
}

export interface ProductResponse {
  success: boolean;
  data?: Product;
  error?: string;
}

export interface ProductListResponse {
  success: boolean;
  data?: Product[];
  total?: number;
  error?: string;
}
