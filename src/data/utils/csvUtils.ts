// src/data/utils/csvUtils.ts
import { ProductCategory, ProductStatus } from "../../types/product";
import {
  CSVProductRow,
  ProductWithMultipleBarcodes,
  PRODUCT_GROUP_MAPPING,
} from "../types/csvTypes";

// Brand extraction from description
export const extractBrand = (description: string, thaiDesc: string): string => {
  // Extract brand from English description
  if (description.includes("BEAR BRAND") || description.includes("BRBR"))
    return "Bear Brand";
  if (description.includes("CARNATION")) return "Carnation";
  if (description.includes("TEAPOT")) return "Teapot";
  if (description.includes("MAGNOLIA")) return "Magnolia";
  if (description.includes("NUTRIWELL")) return "Nutriwell";
  if (description.includes("HAYOCO")) return "Hayoco";

  // Extract from Thai description
  if (thaiDesc.includes("หมี")) return "Bear Brand";
  if (thaiDesc.includes("คาร์เนชัน")) return "Carnation";
  if (thaiDesc.includes("ทีพอท")) return "Teapot";
  if (thaiDesc.includes("แมกโนเลีย")) return "Magnolia";
  if (thaiDesc.includes("นิวทริเวล")) return "Nutriwell";
  if (thaiDesc.includes("ฮาโยโก้")) return "Hayoco";

  return "F&N";
};

// Clean and format product name
export const formatProductName = (
  thaiDesc: string,
  description: string
): string => {
  const name = thaiDesc || description;
  return name
    .replace(/^\d+[xX]\(.*?\)\s*/, "")
    .replace(/\s+\d+[xX].*$/, "")
    .replace(/\s*TH\s*$/, "")
    .replace(/\s*FS\s*$/, "")
    .replace(/\s*P12\s*$/, "")
    .replace(/\s*10B\.\s*$/, "")
    .replace(/\s*\(.*?\)\s*$/, "")
    .trim();
};

// Parse pack size
export const parsePackSize = (packSize: string): number => {
  const match = packSize.match(/\d+/);
  return match ? parseInt(match[0]) : 1;
};

// Normalize barcode for comparison
export const normalizeBarcode = (barcode: string): string => {
  return barcode.replace(/[^0-9]/g, "").trim();
};

// Convert CSV row to product
export const csvRowToProduct = (
  row: CSVProductRow,
  index: number
): ProductWithMultipleBarcodes | null => {
  try {
    // Skip if no material code
    if (!row.Material || row.Material.trim() === "") {
      return null;
    }

    // Clean up barcodes
    const eaBarcode = row["Bar Code EA"]?.trim();
    const dspBarcode = row["Bar Code DSP"]?.trim();
    const csBarcode = row["Bar Code CS"]?.trim();

    // Must have at least one barcode
    if (!eaBarcode && !dspBarcode && !csBarcode) {
      console.warn(`Row ${index}: No barcodes found for ${row.Material}`);
      return null;
    }

    // Determine primary barcode (prefer EA, then DSP, then CS)
    const primaryBarcode = eaBarcode || dspBarcode || csBarcode || "";

    const brand = extractBrand(row.Description || "", row["Thai Desc."] || "");
    const name = formatProductName(
      row["Thai Desc."] || "",
      row.Description || ""
    );
    const category =
      PRODUCT_GROUP_MAPPING[row["Product Group"]] || ProductCategory.OTHER;
    const packSize = parsePackSize(row["Pack Size"] || "1");

    return {
      id: row.Material,
      barcode: primaryBarcode,
      name,
      brand,
      category,
      packSize,
      status: ProductStatus.ACTIVE,
      barcodes: {
        ea: eaBarcode || undefined,
        dsp: dspBarcode || undefined,
        cs: csBarcode || undefined,
        primary: primaryBarcode,
      },
    };
  } catch (error) {
    console.error(`Error converting row ${index}:`, error);
    return null;
  }
};
