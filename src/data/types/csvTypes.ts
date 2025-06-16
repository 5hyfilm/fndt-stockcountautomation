// src/data/types/csvTypes.ts
import { Product, ProductCategory } from "../../types/product";

// CSV Row interface based on the actual CSV structure
export interface CSVProductRow {
  Material: string;
  Description: string;
  "Thai Desc.": string;
  "Pack Size": string;
  "Product Group": string;
  "Shelflife (Months)": string;
  "Bar Code EA": string;
  "Bar Code DSP": string;
  "Bar Code CS": string;
}

// Pack size information interface
export interface PackSizeInfo {
  rawPackSize: string;
  displayText: string;
  totalQuantity: number;
  unit: string | null;
}

// Enhanced Product interface with multiple barcodes and pack size info
export interface ProductWithMultipleBarcodes
  extends Omit<Product, "createdAt" | "updatedAt"> {
  barcodes: {
    ea?: string; // Each unit
    dsp?: string; // Display pack
    cs?: string; // Case/Carton
    primary: string; // Primary barcode for display
    scannedType?: "ea" | "dsp" | "cs"; // Which barcode was scanned
  };
  packSize: number; // Add packSize property
  packSizeInfo: PackSizeInfo; // เพิ่ม field ใหม่สำหรับข้อมูลรายละเอียดของ pack size
  createdAt?: Date; // Make optional
  updatedAt?: Date; // Make optional

  // เพิ่ม properties ที่ใช้ในระบบ manual product addition
  materialCode?: string; // Material code from CSV (same as sku)
  productGroup?: string; // Product group from CSV
  thaiDescription?: string; // Thai description from CSV (same as description)
  shelfLife?: number; // Shelf life in months
}

// Product group to category mapping
export const PRODUCT_GROUP_MAPPING: Record<string, ProductCategory> = {
  STM: ProductCategory.BEVERAGES, // Sterilized Milk
  "BB Gold": ProductCategory.BEVERAGES, // Bear Brand Gold
  EVAP: ProductCategory.DAIRY, // Evaporated
  SBC: ProductCategory.DAIRY, // Sweetened Beverage Creamer
  SCM: ProductCategory.DAIRY, // Sweetened Condensed Milk
  "Magnolia UHT": ProductCategory.BEVERAGES, // Magnolia UHT
  NUTRISOY: ProductCategory.BEVERAGES, // Nutriwell
  Gummy: ProductCategory.CONFECTIONERY, // Gummy candy
};

// Unit type descriptions
export const UNIT_TYPES = {
  ea: "ชิ้น (Each)",
  dsp: "แพ็ค (Display Pack)",
  cs: "ลัง (Case/Carton)",
};
