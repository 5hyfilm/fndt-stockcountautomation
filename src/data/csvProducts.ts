// src/data/csvProducts.ts - Enhanced version with multi-barcode support
import Papa from "papaparse";
import { Product, ProductCategory, ProductStatus } from "../types/product";
import {
  FALLBACK_PRODUCTS,
  findFallbackProductByBarcode,
  getFallbackStats,
} from "./fallbackProducts";
import { promises as fs } from "fs";
import path from "path";

// CSV Row interface based on the actual CSV structure
interface CSVProductRow {
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

// Enhanced Product interface with multiple barcodes
interface ProductWithMultipleBarcodes extends Product {
  barcodes: {
    ea?: string; // Each unit
    dsp?: string; // Display pack
    cs?: string; // Case/Carton
    primary: string; // Primary barcode for display
    scannedType?: "ea" | "dsp" | "cs"; // Which barcode was scanned
  };
}

// Product group to category mapping
const PRODUCT_GROUP_MAPPING: Record<string, ProductCategory> = {
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
const UNIT_TYPES = {
  ea: "ชิ้น (Each)",
  dsp: "แพ็ค (Display Pack)",
  cs: "ลัง (Case/Carton)",
};

// Brand extraction from description
const extractBrand = (description: string, thaiDesc: string): string => {
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
const formatProductName = (thaiDesc: string, description: string): string => {
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

// Parse pack size to extract size and unit
const parsePackSize = (packSize: string): { size: string; unit: string } => {
  const cleanSize = packSize.replace(/[xX\(\)]/g, " ").trim();
  const parts = cleanSize.split(/\s+/).filter(Boolean);
  const lastPart = parts[parts.length - 1];

  let unit = "ชิ้น";
  let size = packSize;

  if (lastPart.includes("ml") || lastPart.includes("Ml")) {
    unit = "มล.";
  } else if (lastPart.includes("g") || lastPart.includes("G")) {
    unit = "ก.";
  } else if (
    lastPart.includes("kg") ||
    lastPart.includes("KG") ||
    lastPart.includes("Kg")
  ) {
    unit = "กก.";
  } else if (lastPart.includes("Ltr") || lastPart.includes("L")) {
    unit = "ลิตร";
  }

  return { size, unit };
};

// Clean barcode - enhanced version
const cleanBarcode = (barcode: string): string => {
  if (!barcode || barcode === "-" || barcode === "nan" || barcode.trim() === "")
    return "";

  // Remove all spaces and non-numeric characters except leading zeros
  let cleaned = barcode.replace(/\s+/g, "").replace(/[^0-9]/g, "");

  // Don't remove leading zeros as they might be significant in some barcode formats
  return cleaned;
};

// Convert CSV row to Product with multiple barcodes
const csvRowToProduct = (
  row: CSVProductRow,
  index: number
): ProductWithMultipleBarcodes | null => {
  try {
    const material = row.Material?.trim();
    const description = row.Description?.trim();
    const thaiDesc = row["Thai Desc."]?.trim();
    const packSize = row["Pack Size"]?.trim();
    const productGroup = row["Product Group"]?.trim();

    // Clean all barcode types
    const barcodeEA = cleanBarcode(row["Bar Code EA"]);
    const barcodeDSP = cleanBarcode(row["Bar Code DSP"]);
    const barcodeCS = cleanBarcode(row["Bar Code CS"]);

    // Skip rows without essential data or any valid barcode
    if (
      !material ||
      !description ||
      (!barcodeEA && !barcodeDSP && !barcodeCS)
    ) {
      console.warn(
        `Skipping row ${index}: Missing essential data or no valid barcodes`
      );
      return null;
    }

    const { size, unit } = parsePackSize(packSize);
    const brand = extractBrand(description, thaiDesc);
    const category =
      PRODUCT_GROUP_MAPPING[productGroup] || ProductCategory.OTHER;
    const shelfLife = parseInt(row["Shelflife (Months)"]) || 12;

    // Determine primary barcode (prefer EA, then DSP, then CS)
    const primaryBarcode = barcodeEA || barcodeDSP || barcodeCS;

    const product: ProductWithMultipleBarcodes = {
      id: material,
      barcode: primaryBarcode, // Keep original field for compatibility
      barcodes: {
        ea: barcodeEA || undefined,
        dsp: barcodeDSP || undefined,
        cs: barcodeCS || undefined,
        primary: primaryBarcode,
      },
      name: formatProductName(thaiDesc, description),
      name_en: description,
      category,
      brand,
      description: `${description} - ${thaiDesc}`,
      size,
      unit,
      price: undefined,
      currency: "THB",
      sku: material,
      nutrition_info: undefined,
      ingredients: undefined,
      allergens: undefined,
      storage_instructions: `อายุการเก็บ ${shelfLife} เดือน`,
      country_of_origin: "ไทย",
      barcode_type:
        primaryBarcode.length === 13
          ? "EAN-13"
          : primaryBarcode.length === 12
          ? "UPC-A"
          : "Other",
      image_url: undefined,
      status: ProductStatus.ACTIVE,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return product;
  } catch (error) {
    console.error(`Error processing row ${index}:`, error);
    return null;
  }
};

// Enhanced barcode matching function
const findBarcodeMatch = (
  searchBarcode: string,
  product: ProductWithMultipleBarcodes
): { matched: boolean; type?: "ea" | "dsp" | "cs"; barcode?: string } => {
  const normalized = normalizeBarcode(searchBarcode);

  // Check each barcode type
  const barcodes = [
    { type: "ea" as const, code: product.barcodes.ea },
    { type: "dsp" as const, code: product.barcodes.dsp },
    { type: "cs" as const, code: product.barcodes.cs },
  ];

  for (const { type, code } of barcodes) {
    if (!code) continue;

    const normalizedCode = normalizeBarcode(code);

    // Exact match
    if (normalizedCode === normalized) {
      return { matched: true, type, barcode: code };
    }

    // Partial matches for different barcode formats
    if (normalized.length >= 12 && normalizedCode.length >= 12) {
      // Last 12 digits match
      if (normalizedCode.slice(-12) === normalized.slice(-12)) {
        return { matched: true, type, barcode: code };
      }

      // First 12 digits match
      if (normalizedCode.slice(0, 12) === normalized.slice(0, 12)) {
        return { matched: true, type, barcode: code };
      }
    }

    // Without leading zeros
    const codeWithoutZeros = normalizedCode.replace(/^0+/, "");
    const searchWithoutZeros = normalized.replace(/^0+/, "");
    if (
      codeWithoutZeros === searchWithoutZeros &&
      codeWithoutZeros.length > 0
    ) {
      return { matched: true, type, barcode: code };
    }
  }

  return { matched: false };
};

// Load and parse CSV data
let csvProducts: ProductWithMultipleBarcodes[] = [];
let csvLoaded = false;
let csvLoading = false;

// Function to read CSV file with proper environment handling
const readCSVFile = async (): Promise<string> => {
  // Check if we're in browser environment
  if (typeof window !== "undefined") {
    console.log("🌐 Loading CSV from browser environment...");

    const baseUrl = window.location.origin;
    const csvUrl = `${baseUrl}/product_list_csv.csv`;

    console.log("📡 Fetching from:", csvUrl);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(csvUrl, {
        signal: controller.signal,
        cache: "no-cache",
        headers: {
          Accept: "text/csv, text/plain, */*",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch CSV: HTTP ${response.status} ${response.statusText}`
        );
      }

      const csvText = await response.text();
      console.log("✅ CSV loaded from browser, size:", csvText.length);
      return csvText;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === "AbortError") {
        throw new Error("Failed to fetch CSV: Request timeout");
      }
      throw new Error(`Failed to fetch CSV: ${fetchError.message}`);
    }
  } else {
    console.log("🖥️ Loading CSV from server environment...");

    try {
      const csvPath = path.join(
        process.cwd(),
        "public",
        "product_list_csv.csv"
      );
      console.log("📂 Reading from path:", csvPath);

      const csvText = await fs.readFile(csvPath, "utf-8");
      console.log("✅ CSV loaded from server, size:", csvText.length);
      return csvText;
    } catch (fsError: any) {
      console.error("❌ Server file read error:", fsError);

      // Fallback to fetch in server environment
      console.log("🔄 Trying fetch fallback in server...");
      const csvUrl = `${
        process.env.NEXTAUTH_URL || "http://localhost:3000"
      }/product_list_csv.csv`;

      try {
        const response = await fetch(csvUrl, {
          signal: AbortSignal.timeout(10000),
          cache: "no-cache",
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return await response.text();
      } catch (fetchFallbackError: any) {
        throw new Error(
          `Both fs and fetch failed: ${fsError.message} | ${fetchFallbackError.message}`
        );
      }
    }
  }
};

export const loadCSVProducts = async (): Promise<
  ProductWithMultipleBarcodes[]
> => {
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
      throw new Error(`Failed to parse CSV: ${parseError}`);
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

    const products: ProductWithMultipleBarcodes[] = [];
    let successCount = 0;
    let errorCount = 0;

    parseResult.data.forEach((row, index) => {
      try {
        const product = csvRowToProduct(row, index);
        if (product) {
          products.push(product);
          successCount++;
        } else {
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

    // Log sample of barcode types found
    const sampleWithBarcodes = products.slice(0, 3).map((p) => ({
      name: p.name,
      barcodes: p.barcodes,
      brand: p.brand,
    }));
    console.log("🏷️ Sample products with barcodes:", sampleWithBarcodes);

    return products;
  } catch (error: any) {
    csvLoading = false;
    csvLoaded = false;
    csvProducts = [];

    console.error("❌ Error loading CSV products:", error);

    if (error.message.includes("fetch")) {
      throw new Error(`Cannot load product data file: ${error.message}`);
    } else if (error.message.includes("parse")) {
      throw new Error(`Product data format error: ${error.message}`);
    } else {
      throw new Error(`Product data loading failed: ${error.message}`);
    }
  }
};

// Helper function to normalize barcode
export const normalizeBarcode = (barcode: string): string => {
  return barcode.trim().replace(/[^0-9]/g, "");
};

// Enhanced barcode matching function with multi-barcode support
export const findProductByBarcode = async (
  inputBarcode: string
): Promise<Product | undefined> => {
  try {
    const products = await loadCSVProducts();
    const searchBarcode = normalizeBarcode(inputBarcode);

    console.log("🔍 Searching for barcode:", searchBarcode);
    console.log("📋 Total products available:", products.length);

    for (const product of products) {
      const match = findBarcodeMatch(searchBarcode, product);

      if (match.matched) {
        console.log(
          `✅ Product found: ${product.name} (${match.type?.toUpperCase()}: ${
            match.barcode
          })`
        );
        console.log(`📦 Unit type: ${UNIT_TYPES[match.type!]}`);

        // Add scanned type to the product for reference
        const resultProduct = {
          ...product,
          barcodes: {
            ...product.barcodes,
            scannedType: match.type,
          },
        };

        // For compatibility, keep the matched barcode as the main barcode
        resultProduct.barcode = match.barcode!;

        return resultProduct;
      }
    }

    console.log("❌ No product found for barcode:", searchBarcode);
    console.log(
      "🔍 Available barcodes sample:",
      products.slice(0, 3).map((p) => ({
        name: p.name,
        barcodes: p.barcodes,
      }))
    );

    return undefined;
  } catch (csvError) {
    console.warn("⚠️ CSV loading failed, trying fallback products:", csvError);

    const fallbackProduct = findFallbackProductByBarcode(inputBarcode);

    if (fallbackProduct) {
      console.log("✅ Found in fallback products:", fallbackProduct.name);
    } else {
      console.log("❌ Not found in fallback products either");
    }

    return fallbackProduct;
  }
};

// Export other functions with type compatibility
export const searchProducts = async (params: {
  name?: string;
  category?: ProductCategory;
  brand?: string;
  status?: ProductStatus;
}): Promise<Product[]> => {
  try {
    const products = await loadCSVProducts();

    return products.filter((product) => {
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
  } catch (error) {
    console.warn("⚠️ Using fallback products for search:", error);
    return FALLBACK_PRODUCTS.filter((product) => {
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
  }
};

export const getProductsByCategory = async (
  category: ProductCategory
): Promise<Product[]> => {
  try {
    const products = await loadCSVProducts();
    return products.filter((product) => product.category === category);
  } catch (error) {
    console.warn("⚠️ Using fallback products for category search:", error);
    return FALLBACK_PRODUCTS.filter((product) => product.category === category);
  }
};

export const getAllBrands = async (): Promise<string[]> => {
  try {
    const products = await loadCSVProducts();
    return [...new Set(products.map((product) => product.brand))];
  } catch (error) {
    console.warn("⚠️ Using fallback products for brands:", error);
    return [...new Set(FALLBACK_PRODUCTS.map((product) => product.brand))];
  }
};

export const getProductStats = async () => {
  try {
    const products = await loadCSVProducts();
    const totalProducts = products.length;
    const activeProducts = products.filter(
      (p) => p.status === ProductStatus.ACTIVE
    ).length;
    const categories = [...new Set(products.map((p) => p.category))].length;
    const brands = [...new Set(products.map((p) => p.brand))].length;

    // Count products by barcode type
    const barcodeStats = {
      withEA: products.filter((p) => p.barcodes.ea).length,
      withDSP: products.filter((p) => p.barcodes.dsp).length,
      withCS: products.filter((p) => p.barcodes.cs).length,
    };

    console.log("📊 Barcode coverage:", barcodeStats);

    return {
      totalProducts,
      activeProducts,
      categories,
      brands,
      barcodeStats,
    };
  } catch (error) {
    console.warn("⚠️ Using fallback stats due to CSV error:", error);
    return getFallbackStats();
  }
};

// Enhanced debug function
export const debugBarcodeMatching = async (testBarcode?: string) => {
  try {
    const products = await loadCSVProducts();
    console.log("📊 Enhanced Barcode Debug Info:");

    const sampleProducts = products.slice(0, 10);
    sampleProducts.forEach((product, index) => {
      const barcodes = product.barcodes;
      console.log(`${index + 1}. ${product.name} (${product.brand}):`);
      if (barcodes.ea) console.log(`   📦 EA: ${barcodes.ea}`);
      if (barcodes.dsp) console.log(`   📋 DSP: ${barcodes.dsp}`);
      if (barcodes.cs) console.log(`   📦 CS: ${barcodes.cs}`);
      console.log(`   🎯 Primary: ${barcodes.primary}`);
    });

    if (testBarcode) {
      console.log(`\n🔍 Testing barcode: ${testBarcode}`);
      const result = await findProductByBarcode(testBarcode);
      if (result) {
        const productWithBarcodes = result as ProductWithMultipleBarcodes;
        console.log(`✅ Found: ${result.name}`);
        console.log(
          `📦 Scanned type: ${
            productWithBarcodes.barcodes?.scannedType || "unknown"
          }`
        );
        console.log(`🏷️ Matched barcode: ${result.barcode}`);
      } else {
        console.log("❌ Not found");
      }
    }
  } catch (error) {
    console.log("📊 Fallback Barcode Debug Info:");
    FALLBACK_PRODUCTS.slice(0, 5).forEach((product, index) => {
      console.log(
        `${index + 1}. ${product.name}: ${product.barcode} (${
          product.barcode.length
        } digits) - ${product.brand}`
      );
    });
  }
};
