// src/services/manualProductService.ts
import { ProductEntryFormData } from "../components/manual-product/ProductEntryForm";
import { BarcodeVerificationResult } from "../components/manual-product/BarcodeVerification";
import { ProductWithMultipleBarcodes } from "../data/types/csvTypes";
import { ProductCategory, ProductStatus } from "../types/product";
import { csvClientService } from "./csvClientService";

// ===== INTERFACES =====
interface ManualProductCreationResult {
  success: boolean;
  product?: ProductWithMultipleBarcodes;
  error?: string;
  warnings?: string[];
  csvRowAdded?: boolean;
  backupCreated?: boolean;
}

interface BarcodeValidationOptions {
  checkFormat?: boolean;
  checkUniqueness?: boolean;
  strictMode?: boolean;
}

interface ProductSuggestions {
  materialCodes: string[];
  productGroups: string[];
  packSizes: string[];
  descriptions: string[];
}

interface ManualProductServiceConfig {
  apiBaseUrl: string;
  csvBackupEnabled: boolean;
  validationStrictMode: boolean;
  autoGenerateMaterialCode: boolean;
}

// ===== CONSTANTS =====
const DEFAULT_CONFIG: ManualProductServiceConfig = {
  apiBaseUrl: "/api",
  csvBackupEnabled: true,
  validationStrictMode: false,
  autoGenerateMaterialCode: false,
};

const MATERIAL_CODE_PATTERNS = {
  FINISHED_GOODS: /^F[0-9]{5,7}$/,
  RAW_MATERIALS: /^R[0-9]{5,7}$/,
  PACKAGING: /^P[0-9]{5,7}$/,
  GENERAL: /^[A-Z]{1,2}[0-9]{4,8}$/,
};

const PRODUCT_GROUP_CATEGORIES: Record<string, ProductCategory> = {
  STM: ProductCategory.BEVERAGES,
  "BB Gold": ProductCategory.BEVERAGES,
  EVAP: ProductCategory.DAIRY,
  SBC: ProductCategory.DAIRY,
  SCM: ProductCategory.DAIRY,
  "Magnolia UHT": ProductCategory.BEVERAGES,
  NUTRISOY: ProductCategory.BEVERAGES,
  Gummy: ProductCategory.CONFECTIONERY,
};

// ===== UTILITY FUNCTIONS =====
const generateMaterialCode = (
  productGroup: string,
  description: string
): string => {
  // Simple algorithm to generate material code
  const groupCode = productGroup.charAt(0).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);

  return `F${groupCode}${timestamp}`;
};

const validateMaterialCode = (
  materialCode: string
): {
  isValid: boolean;
  pattern: string;
  suggestions: string[];
} => {
  const suggestions: string[] = [];

  for (const [patternName, regex] of Object.entries(MATERIAL_CODE_PATTERNS)) {
    if (regex.test(materialCode)) {
      return { isValid: true, pattern: patternName, suggestions: [] };
    }

    // Generate suggestions based on the material code
    if (patternName === "FINISHED_GOODS" && materialCode.startsWith("F")) {
      const numberPart = materialCode.slice(1);
      if (numberPart.length < 5) {
        suggestions.push(`F${numberPart.padStart(6, "0")}`);
      }
    }
  }

  // If no pattern matches, suggest a basic format
  if (suggestions.length === 0) {
    const cleaned = materialCode.replace(/[^A-Z0-9]/g, "");
    if (cleaned.length >= 3) {
      suggestions.push(`F${cleaned.slice(-6).padStart(6, "0")}`);
    }
  }

  return {
    isValid: false,
    pattern: "ไม่ตรงรูปแบบใดๆ",
    suggestions: suggestions.slice(0, 3),
  };
};

const inferCategoryFromProductGroup = (
  productGroup: string
): ProductCategory => {
  return PRODUCT_GROUP_CATEGORIES[productGroup] || ProductCategory.SNACKS;
};

const validatePackSize = (
  packSize: string
): {
  isValid: boolean;
  standardized: string;
  warnings: string[];
} => {
  const warnings: string[] = [];
  let standardized = packSize.trim();

  // Common patterns and their standardizations
  const patterns = [
    { from: /(\d+)\s*x\s*(\d+)(ml|g|kg|l)/i, to: "$1x$2$3" },
    { from: /(\d+)\s*pcs?/i, to: "$1 ชิ้น" },
    { from: /(\d+)\s*pieces?/i, to: "$1 ชิ้น" },
    { from: /(\d+)\s*(กรัม|g)/i, to: "$1g" },
    { from: /(\d+)\s*(กิโลกรัม|kg)/i, to: "$1kg" },
    { from: /(\d+)\s*(มิลลิลิตร|ml)/i, to: "$1ml" },
    { from: /(\d+)\s*(ลิตร|l)/i, to: "$1L" },
  ];

  for (const pattern of patterns) {
    if (pattern.from.test(packSize)) {
      standardized = packSize.replace(pattern.from, pattern.to);
      break;
    }
  }

  // Validation checks
  if (!/\d/.test(standardized)) {
    return {
      isValid: false,
      standardized: packSize,
      warnings: ["ขนาดแพ็คควรมีตัวเลข"],
    };
  }

  if (standardized !== packSize) {
    warnings.push(`แนะนำรูปแบบมาตรฐาน: ${standardized}`);
  }

  return {
    isValid: true,
    standardized,
    warnings,
  };
};

// ===== MAIN SERVICE CLASS =====
export class ManualProductService {
  private config: ManualProductServiceConfig;

  constructor(config: Partial<ManualProductServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ===== BARCODE VALIDATION =====
  async validateBarcode(
    barcode: string,
    barcodeType: "ea" | "dsp" | "cs",
    options: BarcodeValidationOptions = {}
  ): Promise<BarcodeVerificationResult> {
    const {
      checkFormat = true,
      checkUniqueness = true,
      strictMode = this.config.validationStrictMode,
    } = options;

    try {
      const result: BarcodeVerificationResult = {
        isValid: true,
        isUnique: true,
        format: "Unknown",
        warnings: [],
      };

      // Format validation
      if (checkFormat) {
        const formatResult = await this.validateBarcodeFormat(barcode);
        result.isValid = formatResult.isValid;
        result.format = formatResult.format;
        result.warnings = formatResult.warnings;

        if (!result.isValid && strictMode) {
          return result;
        }
      }

      // Uniqueness validation
      if (checkUniqueness && result.isValid) {
        const uniquenessResult = await this.checkBarcodeUniqueness(
          barcode,
          barcodeType
        );
        result.isUnique = uniquenessResult.isUnique;
        result.existingProduct = uniquenessResult.existingProduct;

        if (!result.isUnique) {
          result.warnings?.push("Barcode นี้มีในระบบแล้ว");
        }
      }

      return result;
    } catch (error) {
      console.error("Barcode validation error:", error);
      return {
        isValid: false,
        isUnique: false,
        format: "Error",
        warnings: ["เกิดข้อผิดพลาดในการตรวจสอบ"],
      };
    }
  }

  private async validateBarcodeFormat(barcode: string): Promise<{
    isValid: boolean;
    format: string;
    warnings: string[];
  }> {
    // Call API for format validation
    try {
      const response = await fetch(
        `${this.config.apiBaseUrl}/products/validate-barcode`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ barcode }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Format validation API error:", error);

      // Fallback to client-side validation
      return this.clientSideFormatValidation(barcode);
    }
  }

  private clientSideFormatValidation(barcode: string): {
    isValid: boolean;
    format: string;
    warnings: string[];
  } {
    const cleaned = barcode.replace(/[^0-9]/g, "");
    const warnings: string[] = [];

    if (cleaned !== barcode) {
      warnings.push("มีอักขระที่ไม่ใช่ตัวเลข จะถูกล้างออก");
    }

    // EAN-13 (most common)
    if (cleaned.length === 13) {
      return { isValid: true, format: "EAN-13", warnings };
    }

    // UPC-A
    if (cleaned.length === 12) {
      return { isValid: true, format: "UPC-A", warnings };
    }

    // EAN-8
    if (cleaned.length === 8) {
      return { isValid: true, format: "EAN-8", warnings };
    }

    // ITF-14
    if (cleaned.length === 14) {
      return { isValid: true, format: "ITF-14", warnings };
    }

    warnings.push("ความยาว barcode ไม่ตรงมาตรฐาน");
    return {
      isValid: false,
      format: `${cleaned.length} หลัก (ไม่ทราบรูปแบบ)`,
      warnings,
    };
  }

  private async checkBarcodeUniqueness(
    barcode: string,
    barcodeType: "ea" | "dsp" | "cs"
  ): Promise<{
    isUnique: boolean;
    existingProduct?: any;
  }> {
    try {
      const response = await fetch(
        `${this.config.apiBaseUrl}/products/check-uniqueness`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ barcode, barcodeType }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Uniqueness check API error:", error);

      // Fallback - assume unique for now
      return { isUnique: true };
    }
  }

  // ===== FORM VALIDATION =====
  validateFormData(formData: ProductEntryFormData): {
    isValid: boolean;
    errors: Record<string, string>;
    warnings: string[];
  } {
    const errors: Record<string, string> = {};
    const warnings: string[] = [];

    // Material Code validation
    const materialCodeValidation = validateMaterialCode(formData.materialCode);
    if (!materialCodeValidation.isValid) {
      errors.materialCode = `รูปแบบไม่ถูกต้อง: ${materialCodeValidation.pattern}`;
      if (materialCodeValidation.suggestions.length > 0) {
        warnings.push(
          `แนะนำ: ${materialCodeValidation.suggestions.join(", ")}`
        );
      }
    }

    // Pack Size validation
    const packSizeValidation = validatePackSize(formData.packSize);
    if (!packSizeValidation.isValid) {
      errors.packSize = packSizeValidation.warnings[0] || "รูปแบบไม่ถูกต้อง";
    } else if (packSizeValidation.warnings.length > 0) {
      warnings.push(...packSizeValidation.warnings);
    }

    // Required fields
    const requiredFields = [
      "materialCode",
      "description",
      "thaiDescription",
      "packSize",
      "productGroup",
      "barcodeType",
    ];

    for (const field of requiredFields) {
      if (!formData[field as keyof ProductEntryFormData]?.trim()) {
        errors[field] = "ข้อมูลนี้จำเป็นต้องกรอก";
      }
    }

    // Description length validation
    if (formData.description && formData.description.length < 3) {
      errors.description = "รายละเอียดต้องมีอย่างน้อย 3 ตัวอักษร";
    }

    if (formData.thaiDescription && formData.thaiDescription.length < 3) {
      errors.thaiDescription = "รายละเอียดภาษาไทยต้องมีอย่างน้อย 3 ตัวอักษร";
    }

    // Shelf life validation
    if (
      formData.shelfLife &&
      (isNaN(Number(formData.shelfLife)) || Number(formData.shelfLife) <= 0)
    ) {
      errors.shelfLife = "อายุการเก็บรักษาต้องเป็นตัวเลขที่มากกว่า 0";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings,
    };
  }

  // ===== PRODUCT CREATION =====
  async createManualProduct(
    formData: ProductEntryFormData,
    employeeContext: {
      employeeName: string;
      branchCode: string;
      branchName: string;
    }
  ): Promise<ManualProductCreationResult> {
    try {
      // Validate form data
      const validation = this.validateFormData(formData);
      if (!validation.isValid) {
        return {
          success: false,
          error:
            "ข้อมูลไม่ถูกต้อง: " + Object.values(validation.errors).join(", "),
          warnings: validation.warnings,
        };
      }

      // Create backup if enabled
      let backupCreated = false;
      if (this.config.csvBackupEnabled) {
        backupCreated = await this.createCSVBackup();
      }

      // Prepare product data
      const productData = this.prepareProductData(formData, employeeContext);

      // Call API to create product
      const response = await fetch(
        `${this.config.apiBaseUrl}/products/manual-add`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();

      return {
        success: true,
        product: result.product,
        warnings: validation.warnings,
        csvRowAdded: true,
        backupCreated,
      };
    } catch (error) {
      console.error("Manual product creation error:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "เกิดข้อผิดพลาดไม่ทราบสาเหตุ",
      };
    }
  }

  private prepareProductData(
    formData: ProductEntryFormData,
    employeeContext: {
      employeeName: string;
      branchCode: string;
      branchName: string;
    }
  ): ProductWithMultipleBarcodes {
    const category = inferCategoryFromProductGroup(formData.productGroup);

    return {
      id: `manual_${Date.now()}`,
      barcode: formData.scannedBarcode,
      name: formData.thaiDescription,
      name_en: formData.description,
      description: formData.thaiDescription,
      brand: this.extractBrandFromDescription(formData.description),
      category,
      price: 0, // Will be set later
      status: ProductStatus.ACTIVE,
      sku: formData.materialCode,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      barcodes: {
        primary: formData.scannedBarcode,
        ea: formData.barcodeType === "ea" ? formData.scannedBarcode : undefined,
        dsp:
          formData.barcodeType === "dsp" ? formData.scannedBarcode : undefined,
        cs: formData.barcodeType === "cs" ? formData.scannedBarcode : undefined,
      },
      packSize: this.parsePackSizeNumber(formData.packSize),
      packSizeInfo: {
        rawPackSize: formData.packSize,
        displayText: formData.packSize,
        totalQuantity: this.parsePackSizeNumber(formData.packSize),
        unit: this.extractUnitFromPackSize(formData.packSize),
      },
      // Additional fields for CSV compatibility
      shelfLife: formData.shelfLife ? parseInt(formData.shelfLife) : undefined,
      productGroup: formData.productGroup,
      materialCode: formData.materialCode,
      thaiDescription: formData.thaiDescription,
      // Additional metadata
      addedBy: employeeContext.employeeName,
      addedAt: new Date(),
      branchCode: employeeContext.branchCode,
    };
  }

  private extractBrandFromDescription(description: string): string {
    // Simple brand extraction logic
    const commonBrands = ["Bear Brand", "Magnolia", "Nutriwell", "F&N"];

    for (const brand of commonBrands) {
      if (description.toLowerCase().includes(brand.toLowerCase())) {
        return brand;
      }
    }

    // Fallback to first word
    return description.split(" ")[0] || "Unknown";
  }

  private parsePackSizeNumber(packSize: string): number {
    const numbers = packSize.match(/\d+/g);
    if (!numbers) return 1;

    // If it's something like "12x250ml", multiply the numbers
    if (packSize.includes("x") && numbers.length >= 2) {
      return parseInt(numbers[0]) * parseInt(numbers[1]);
    }

    // Otherwise, return the first number
    return parseInt(numbers[0]);
  }

  private extractUnitFromPackSize(packSize: string): string | null {
    const unitMatch = packSize.match(/(ml|g|kg|l|ชิ้น|แพ็ค|ลัง)/i);
    return unitMatch ? unitMatch[1].toLowerCase() : null;
  }

  // ===== SUGGESTIONS =====
  async getProductSuggestions(): Promise<ProductSuggestions> {
    try {
      const response = await fetch(
        `${this.config.apiBaseUrl}/products/suggestions`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to get suggestions:", error);

      // Return default suggestions
      return {
        materialCodes: ["F123456", "F789012", "FG345678"],
        productGroups: [
          "STM",
          "BB Gold",
          "EVAP",
          "SBC",
          "SCM",
          "Magnolia UHT",
          "NUTRISOY",
          "Gummy",
        ],
        packSizes: ["12x250ml", "24 ชิ้น", "6x330ml", "1kg", "500g", "1L"],
        descriptions: [],
      };
    }
  }

  // ===== BACKUP OPERATIONS =====
  private async createCSVBackup(): Promise<boolean> {
    try {
      const result = await csvClientService.createBackup();
      return result.success;
    } catch (error) {
      console.error("Backup creation failed:", error);
      return false;
    }
  }

  // ===== UTILITY METHODS =====
  generateMaterialCodeSuggestion(
    productGroup: string,
    description: string
  ): string {
    if (this.config.autoGenerateMaterialCode) {
      return generateMaterialCode(productGroup, description);
    }
    return "";
  }

  formatBarcodeDisplay(barcode: string, type: "ea" | "dsp" | "cs"): string {
    return `${barcode} (${type.toUpperCase()})`;
  }

  estimateProcessingTime(formData: ProductEntryFormData): number {
    // Estimate processing time in milliseconds based on data complexity
    let baseTime = 1000; // 1 second base

    if (formData.description.length > 50) baseTime += 200;
    if (formData.thaiDescription.length > 50) baseTime += 200;
    if (formData.shelfLife) baseTime += 100;

    return baseTime;
  }
}

// ===== SINGLETON INSTANCE =====
export const manualProductService = new ManualProductService();

// ===== EXPORT TYPES =====
export type {
  ManualProductCreationResult,
  BarcodeValidationOptions,
  ProductSuggestions,
  ManualProductServiceConfig,
};
