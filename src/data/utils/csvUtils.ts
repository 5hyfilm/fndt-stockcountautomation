// Path: src/data/utils/csvUtils.ts
// Enhanced with barcode type detection and separate unit support

import {
  ProductCategory,
  ProductStatus,
  BarcodeType,
} from "../../types/product";
import {
  CSVProductRow,
  ProductWithMultipleBarcodes,
  PRODUCT_GROUP_MAPPING,
  PackSizeInfo,
  BarcodeSearchResult,
  CSVUtils,
} from "../types/csvTypes";

// ✅ NEW: Main product search function with barcode type detection
export const findProductByBarcode = async (
  products: ProductWithMultipleBarcodes[],
  scannedBarcode: string
): Promise<BarcodeSearchResult> => {
  return CSVUtils.searchByBarcode(products, scannedBarcode);
};

// Brand extraction from description (enhanced)
export const extractBrand = (description: string, thaiDesc: string): string => {
  // Extract brand from English description
  if (description.includes("BEAR BRAND") || description.includes("BRBR"))
    return "Bear Brand";
  if (description.includes("CARNATION")) return "Carnation";
  if (description.includes("TEAPOT")) return "Teapot";
  if (description.includes("MAGNOLIA")) return "Magnolia";
  if (description.includes("NUTRIWELL") || description.includes("NUTRISOY"))
    return "Nutriwell";
  if (description.includes("HAYOCO")) return "Hayoco";

  // Extract from Thai description
  if (thaiDesc.includes("หมี")) return "Bear Brand";
  if (thaiDesc.includes("คาร์เนชัน")) return "Carnation";
  if (thaiDesc.includes("ทีพอท")) return "Teapot";
  if (thaiDesc.includes("แมกโนเลีย")) return "Magnolia";
  if (thaiDesc.includes("นิวทริเวล") || thaiDesc.includes("นิวทริซอย"))
    return "Nutriwell";
  if (thaiDesc.includes("ฮาโยโก้")) return "Hayoco";

  // Extract from first word of description
  const firstWord = description.split(/\s+/)[0];
  return firstWord && firstWord.length > 1 ? firstWord : "F&N";
};

// ✅ UPDATED: Clean and format product name (ใช้ CSVUtils)
export const formatProductName = (
  thaiDesc: string,
  description: string
): string => {
  return CSVUtils.formatProductName(thaiDesc, description);
};

// Enhanced pack size parsing with better error handling
export const parsePackSizeInfo = (packSize: string): PackSizeInfo => {
  const raw = packSize.trim();

  // Handle different patterns
  // Pattern 1: 8X(12X140ml) -> 8 packs of (12 x 140ml)
  const pattern1 = raw.match(/^(\d+)[xX]\((\d+)[xX](\d+)(ml|g|kg|l)\)$/i);
  if (pattern1) {
    const [, outerPack, innerPack, size, unit] = pattern1;
    const totalQty = parseInt(outerPack) * parseInt(innerPack);
    return {
      rawPackSize: raw,
      displayText: `${outerPack} แพ็ค (${innerPack} x ${size}${unit})`,
      totalQuantity: totalQty,
      unit: unit.toLowerCase(),
    };
  }

  // Pattern 2: 16X(6X140ml) -> 16 packs of (6 x 140ml)
  const pattern2 = raw.match(/^(\d+)[xX]\((\d+)[xX](\d+)(ml|g|kg|l)\)$/i);
  if (pattern2) {
    const [, outerPack, innerPack, size, unit] = pattern2;
    const totalQty = parseInt(outerPack) * parseInt(innerPack);
    return {
      rawPackSize: raw,
      displayText: `${outerPack} แพ็ค (${innerPack} x ${size}${unit})`,
      totalQuantity: totalQty,
      unit: unit.toLowerCase(),
    };
  }

  // Pattern 3: 30x150ml -> 30 x 150ml
  const pattern3 = raw.match(/^(\d+)[xX](\d+)(ml|g|kg|l)$/i);
  if (pattern3) {
    const [, quantity, size, unit] = pattern3;
    return {
      rawPackSize: raw,
      displayText: `${quantity} x ${size}${unit}`,
      totalQuantity: parseInt(quantity),
      unit: unit.toLowerCase(),
    };
  }

  // Pattern 4: 12(4x150ml) -> 12 packs of (4 x 150ml)
  const pattern4 = raw.match(/^(\d+)\((\d+)[xX](\d+)(ml|g|kg|l)\)$/i);
  if (pattern4) {
    const [, outerPack, innerPack, size, unit] = pattern4;
    const totalQty = parseInt(outerPack) * parseInt(innerPack);
    return {
      rawPackSize: raw,
      displayText: `${outerPack} แพ็ค (${innerPack} x ${size}${unit})`,
      totalQuantity: totalQty,
      unit: unit.toLowerCase(),
    };
  }

  // Pattern 5: Just numbers
  const pattern5 = raw.match(/^(\d+)$/);
  if (pattern5) {
    const [, quantity] = pattern5;
    return {
      rawPackSize: raw,
      displayText: `${quantity} ชิ้น`,
      totalQuantity: parseInt(quantity),
      unit: null,
    };
  }

  // Pattern 6: With unit text (24-pack, 30ml)
  const pattern6 = raw.match(/^(\d+)[\s\-]*(pack|ml|g|kg|l)$/i);
  if (pattern6) {
    const [, quantity, unit] = pattern6;
    return {
      rawPackSize: raw,
      displayText: `${quantity} ${unit}`,
      totalQuantity: parseInt(quantity),
      unit: unit.toLowerCase(),
    };
  }

  // Fallback: return as-is with safe defaults
  return {
    rawPackSize: raw,
    displayText: raw || "1 ชิ้น",
    totalQuantity: 1,
    unit: null,
  };
};

// Parse pack size (keep backward compatibility)
export const parsePackSize = (packSize: string): number => {
  const packInfo = parsePackSizeInfo(packSize);
  return packInfo.totalQuantity;
};

// ✅ UPDATED: Normalize barcode for comparison (ใช้ CSVUtils)
export const normalizeBarcode = (barcode: string): string => {
  return CSVUtils.normalizeBarcode(barcode);
};

// ✅ MAJOR UPDATE: Convert CSV row to product with enhanced barcode support
export const csvRowToProduct = (
  row: CSVProductRow,
  index: number
): ProductWithMultipleBarcodes | null => {
  try {
    // Validate required fields
    const validation = CSVUtils.validateCSVRow(row, index);
    if (!validation.isValid) {
      console.warn(`Row ${index} validation failed:`, validation.errors);
      return null;
    }

    // Clean up and validate barcodes
    const eaBarcode = row["Bar Code EA"]?.trim() || "";
    const dspBarcode = row["Bar Code DSP"]?.trim() || "";
    const csBarcode = row["Bar Code CS"]?.trim() || "";

    // Validate barcode quality (ใช้ CSVUtils)
    const validEA = CSVUtils.isValidBarcode(eaBarcode);
    const validDSP = CSVUtils.isValidBarcode(dspBarcode);
    const validCS = CSVUtils.isValidBarcode(csBarcode);

    // Must have at least one valid barcode
    if (!validEA && !validDSP && !validCS) {
      console.warn(`Row ${index}: No valid barcodes found for ${row.Material}`);
      return null;
    }

    // Determine primary barcode (prefer EA, then DSP, then CS)
    let primaryBarcode = "";
    if (validEA) primaryBarcode = eaBarcode;
    else if (validDSP) primaryBarcode = dspBarcode;
    else if (validCS) primaryBarcode = csBarcode;

    // Extract brand and product information
    const brand = CSVUtils.extractBrand(
      row.Description || "",
      row["Thai Desc."] || ""
    );
    const name = CSVUtils.formatProductName(
      row["Thai Desc."] || "",
      row.Description || ""
    );
    const category =
      PRODUCT_GROUP_MAPPING[row["Product Group"]] || ProductCategory.OTHER;

    // Parse pack size info
    const packSizeInfo = parsePackSizeInfo(row["Pack Size"] || "1");
    const packSize = packSizeInfo.totalQuantity;

    // ✅ NEW: Create complete product with enhanced barcode structure
    const product: ProductWithMultipleBarcodes = {
      id: row.Material,
      barcode: primaryBarcode, // For backward compatibility
      name,
      brand,
      category,
      status: ProductStatus.ACTIVE,
      sku: row.Material,

      // ✅ Enhanced barcode structure
      barcodes: {
        ea: validEA ? eaBarcode : undefined,
        dsp: validDSP ? dspBarcode : undefined,
        cs: validCS ? csBarcode : undefined,
        primary: primaryBarcode,
        // scannedType will be set during detection
      },

      // ✅ NEW: Additional product information
      materialCode: row.Material,
      productGroup: row["Product Group"],
      packSize,
      packSizeInfo,

      // Optional fields
      size: packSizeInfo.displayText,
      unit: packSizeInfo.unit || "ชิ้น",
      description: row["Thai Desc."] || row.Description,

      // Timestamps
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log(`✅ Row ${index}: Created product ${product.name}`, {
      materialCode: product.materialCode,
      barcodes: {
        EA: validEA ? "✓" : "✗",
        DSP: validDSP ? "✓" : "✗",
        CS: validCS ? "✓" : "✗",
      },
      primary: primaryBarcode,
    });

    return product;
  } catch (error) {
    console.error(`❌ Error converting row ${index}:`, error);
    return null;
  }
};

// ✅ NEW: Utility functions for product management

/**
 * Find all products that match a barcode across all types
 */
export const findAllBarcodeMatches = (
  products: ProductWithMultipleBarcodes[],
  scannedBarcode: string
): BarcodeSearchResult[] => {
  const normalized = normalizeBarcode(scannedBarcode);
  const results: BarcodeSearchResult[] = [];

  products.forEach((product) => {
    // Check each barcode type
    [BarcodeType.EA, BarcodeType.DSP, BarcodeType.CS].forEach((type) => {
      const barcode = CSVUtils.getBarcodeByType(product, type);
      if (barcode && normalizeBarcode(barcode) === normalized) {
        results.push({
          found: true,
          product: {
            ...product,
            barcodes: {
              ...product.barcodes,
              scannedType: type,
            },
            detectedBarcodeType: type,
          },
          detectedType: type,
          scannedBarcode,
          normalizedBarcode: normalized,
          matchedBarcode: barcode,
        });
      }
    });
  });

  return results;
};

/**
 * Get product statistics by barcode types
 */
export const getProductBarcodeStats = (
  products: ProductWithMultipleBarcodes[]
) => {
  const stats = {
    totalProducts: products.length,
    withEA: 0,
    withDSP: 0,
    withCS: 0,
    withAllTypes: 0,
    withMultipleTypes: 0,
  };

  products.forEach((product) => {
    const types = CSVUtils.getAvailableBarcodeTypes(product);

    if (types.includes(BarcodeType.EA)) stats.withEA++;
    if (types.includes(BarcodeType.DSP)) stats.withDSP++;
    if (types.includes(BarcodeType.CS)) stats.withCS++;

    if (types.length === 3) stats.withAllTypes++;
    if (types.length > 1) stats.withMultipleTypes++;
  });

  return stats;
};

/**
 * Debug function to check barcode coverage
 */
export const debugBarcodeTypes = (products: ProductWithMultipleBarcodes[]) => {
  console.group("🔍 Barcode Type Analysis");

  const stats = getProductBarcodeStats(products);
  console.log("📊 Statistics:", stats);

  // Sample products with multiple barcode types
  const multiBarcode = products
    .filter((p) => CSVUtils.getAvailableBarcodeTypes(p).length > 1)
    .slice(0, 5);

  console.log("📦 Sample products with multiple barcodes:");
  multiBarcode.forEach((product) => {
    const types = CSVUtils.getAvailableBarcodeTypes(product);
    console.log(`- ${product.name}: ${types.join(", ")}`);
  });

  console.groupEnd();
};

// ✅ Export all CSVUtils functions for convenience
export {
  CSVUtils,
  // Re-export specific functions that are commonly used
  CSVUtils as BarcodeDetectionUtils,
};
