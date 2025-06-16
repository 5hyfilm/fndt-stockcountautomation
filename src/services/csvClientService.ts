// src/services/csvClientService.ts
// Client-side CSV operations (browser environment)
import { ProductEntryFormData } from "../components/manual-product/ProductEntryForm";
import { CSVProductRow } from "../data/types/csvTypes";

// ===== INTERFACES =====
interface CSVUpdateResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

interface CSVValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ===== CLIENT-SIDE CSV SERVICE =====
export class CSVClientService {
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string = "/api") {
    this.apiBaseUrl = apiBaseUrl;
  }

  // ===== API-BASED CSV OPERATIONS =====
  async addProductToCSV(
    formData: ProductEntryFormData
  ): Promise<CSVUpdateResult> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/products/csv/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ formData }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return {
        success: true,
        message: result.message,
        data: result.data,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  async validateCSV(): Promise<CSVValidationResult> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/products/csv/validate`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : "Validation failed"],
        warnings: [],
      };
    }
  }

  async createBackup(): Promise<CSVUpdateResult> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/products/csv/backup`, {
        method: "POST",
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return {
        success: true,
        message: result.message,
        data: result.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Backup failed",
      };
    }
  }

  async getCSVStatistics(): Promise<any> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/products/csv/stats`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result.data;
    } catch (error) {
      console.error("Failed to get CSV statistics:", error);
      return {
        totalProducts: 0,
        fileSize: 0,
        lastModified: new Date(),
        barcodeStats: { withEA: 0, withDSP: 0, withCS: 0 },
      };
    }
  }

  // ===== HEALTH CHECK =====
  async healthCheck(): Promise<{
    csvExists: boolean;
    csvReadable: boolean;
    csvWritable: boolean;
    lastCheck: Date;
  }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/products/csv/health`);
      const result = await response.json();

      return {
        csvExists: result.csvExists || false,
        csvReadable: result.csvReadable || false,
        csvWritable: result.csvWritable || false,
        lastCheck: new Date(),
      };
    } catch (error) {
      return {
        csvExists: false,
        csvReadable: false,
        csvWritable: false,
        lastCheck: new Date(),
      };
    }
  }
}

// ===== SINGLETON INSTANCE =====
export const csvClientService = new CSVClientService();

// ===== UTILITY FUNCTIONS =====
export const formatCSVRow = (formData: ProductEntryFormData): CSVProductRow => {
  return {
    Material: formData.materialCode,
    Description: formData.description,
    "Thai Desc.": formData.thaiDescription,
    "Pack Size": formData.packSize,
    "Product Group": formData.productGroup,
    "Shelflife (Months)": formData.shelfLife || "",
    "Bar Code EA": formData.barcodeType === "ea" ? formData.scannedBarcode : "",
    "Bar Code DSP":
      formData.barcodeType === "dsp" ? formData.scannedBarcode : "",
    "Bar Code CS": formData.barcodeType === "cs" ? formData.scannedBarcode : "",
  };
};

export const validateCSVRow = (
  row: CSVProductRow
): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (!row.Material?.trim()) {
    errors.push("Material code is required");
  }

  if (!row.Description?.trim()) {
    errors.push("Description is required");
  }

  if (!row["Thai Desc."]?.trim()) {
    errors.push("Thai description is required");
  }

  if (!row["Pack Size"]?.trim()) {
    errors.push("Pack size is required");
  }

  if (!row["Product Group"]?.trim()) {
    errors.push("Product group is required");
  }

  // At least one barcode must be provided
  const hasBarcode =
    row["Bar Code EA"]?.trim() ||
    row["Bar Code DSP"]?.trim() ||
    row["Bar Code CS"]?.trim();

  if (!hasBarcode) {
    errors.push("At least one barcode (EA, DSP, or CS) is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export type { CSVUpdateResult, CSVValidationResult };
