// src/data/loaders/csvLoader.ts
import Papa from "papaparse";
import { Product } from "../../types/product";
import {
  CSVProductRow,
  csvRowToProduct,
  validateCSVProductRow,
} from "../types/csvTypes";
import { readCSVFile } from "../readers/csvReader";

// ✅ Cache variables using Product type
let csvProducts: Product[] = [];
let csvLoaded = false;
let csvLoading = false;

// Define proper error type instead of using any
interface CSVLoaderError {
  message: string;
  name?: string;
  code?: string;
  cause?: unknown;
}

// Type guard to check if error has message property
const isErrorWithMessage = (error: unknown): error is CSVLoaderError => {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as Record<string, unknown>).message === "string"
  );
};

// Helper function to get error message
const getErrorMessage = (error: unknown): string => {
  if (isErrorWithMessage(error)) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "เกิดข้อผิดพลาดในการโหลดข้อมูล CSV";
};

// ✅ Updated to return Product[] instead of ProductWithMultipleBarcodes[]
export const loadCSVProducts = async (): Promise<Product[]> => {
  if (csvLoaded && csvProducts.length > 0) {
    console.log("📋 Using cached CSV products:", csvProducts.length);
    return csvProducts;
  }

  if (csvLoading) {
    console.log("⏳ CSV already loading...");
    const startTime = Date.now();
    while (csvLoading && Date.now() - startTime < 15000) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (csvLoading) {
      csvLoading = false;
      throw new Error("CSV loading timeout - took too long to load");
    }

    return csvProducts;
  }

  csvLoading = true;

  try {
    console.log("🔄 Loading CSV product data...");

    const csvText = await readCSVFile();

    if (!csvText || csvText.trim().length === 0) {
      throw new Error("CSV file is empty or invalid");
    }

    console.log("📄 CSV file loaded, size:", csvText.length, "characters");

    let parseResult: Papa.ParseResult<CSVProductRow>;
    try {
      parseResult = Papa.parse<CSVProductRow>(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim(),
        dynamicTyping: false,
      });
    } catch (parseError) {
      const errorMessage = getErrorMessage(parseError);
      throw new Error(`Failed to parse CSV: ${errorMessage}`);
    }

    if (parseResult.errors && parseResult.errors.length > 0) {
      const criticalErrors = parseResult.errors.filter(
        (error) => error.type === "Delimiter" || error.type === "Quotes"
      );

      if (criticalErrors.length > 0) {
        console.error("💥 Critical CSV parsing errors:", criticalErrors);
        throw new Error(
          `Critical CSV parsing errors: ${criticalErrors[0].message}`
        );
      }

      console.warn("⚠️ Non-critical CSV parsing warnings:", parseResult.errors);
    }

    if (!parseResult.data || parseResult.data.length === 0) {
      throw new Error(
        "No data returned from CSV parsing - file may be empty or invalid format"
      );
    }

    console.log("📊 CSV parsed successfully:", parseResult.data.length, "rows");

    // ✅ Updated to use Product[] type
    const products: Product[] = [];
    let successCount = 0;
    let errorCount = 0;

    parseResult.data.forEach((row, index) => {
      try {
        // ✅ Validate row first
        const validation = validateCSVProductRow(row);
        if (!validation.isValid) {
          console.warn(`Row ${index} validation failed:`, validation.errors);
          errorCount++;
          return;
        }

        // ✅ Convert CSV row to Product (no index parameter needed)
        const productData = csvRowToProduct(row);

        if (
          productData &&
          productData.materialCode &&
          productData.productName
        ) {
          // ✅ Create complete Product object with required fields
          const product: Product = {
            id: productData.materialCode, // Use materialCode as ID
            materialCode: productData.materialCode,
            productName: productData.productName,
            brand: productData.brand || "Unknown",
            category: productData.category!,
            size: productData.size || "N/A",
            unit: productData.unit || "ชิ้น",
            barcode: productData.barcode!,
            status: productData.status || "active",

            // Optional fields
            price: productData.price,
            thaiDescription: productData.thaiDescription,
            productGroup: productData.productGroup,

            // Timestamps
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),

            // Handle multiple barcodes if needed
            alternativeBarcodes: [], // Can be populated later if CSV has multiple barcode columns
          };

          products.push(product);
          successCount++;
        } else {
          console.warn(`Row ${index} missing required fields:`, row);
          errorCount++;
        }
      } catch (rowError) {
        console.warn(`Error processing row ${index}:`, rowError);
        errorCount++;
      }
    });

    if (products.length === 0) {
      throw new Error("No valid products could be created from CSV data");
    }

    csvProducts = products;
    csvLoaded = true;
    csvLoading = false;

    console.log(
      `✅ CSV products loaded successfully: ${products.length} products (${successCount} success, ${errorCount} errors)`
    );

    // ✅ Log sample with correct property names
    const sampleWithBarcodes = products.slice(0, 3).map((p) => ({
      productName: p.productName, // ✅ Fix: productName instead of name
      barcode: p.barcode, // ✅ Fix: barcode instead of barcodes
      alternativeBarcodes: p.alternativeBarcodes, // ✅ Multiple barcodes support
      brand: p.brand,
      category: p.category,
      productGroup: p.productGroup,
    }));
    console.log("🏷️ Sample products with barcodes:", sampleWithBarcodes);

    return products;
  } catch (error: unknown) {
    csvLoading = false;
    csvLoaded = false;
    csvProducts = [];

    const errorMessage = getErrorMessage(error);
    console.error("❌ Error loading CSV products:", error);

    if (errorMessage.includes("fetch")) {
      throw new Error(`Cannot load product data file: ${errorMessage}`);
    } else if (errorMessage.includes("parse")) {
      throw new Error(`Product data format error: ${errorMessage}`);
    } else {
      throw new Error(`Product data loading failed: ${errorMessage}`);
    }
  }
};

// ✅ Helper function to add alternative barcodes to a product
export const addAlternativeBarcode = (
  product: Product,
  barcode: string
): Product => {
  return {
    ...product,
    alternativeBarcodes: [...(product.alternativeBarcodes || []), barcode],
  };
};

// ✅ Helper function to find product by any barcode (primary or alternative)
export const findProductByAnyBarcode = (
  products: Product[],
  barcode: string
): Product | undefined => {
  return products.find(
    (product) =>
      product.barcode === barcode ||
      product.alternativeBarcodes?.includes(barcode)
  );
};

// ✅ Get cached products (for external use)
export const getCachedProducts = (): Product[] => {
  return csvProducts;
};

// ✅ Clear cache (for testing or refresh)
export const clearProductCache = (): void => {
  csvProducts = [];
  csvLoaded = false;
  csvLoading = false;
};

// ✅ Check if CSV is loaded
export const isCSVLoaded = (): boolean => {
  return csvLoaded && csvProducts.length > 0;
};
