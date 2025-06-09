// src/data/csvProducts.ts - CSV Product Data Handler with Fetch
import Papa from "papaparse";
import { Product, ProductCategory, ProductStatus } from "../types/product";

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
  // Use Thai description if available, otherwise use English
  const name = thaiDesc || description;

  // Remove common prefixes/suffixes and clean up
  return name
    .replace(/^\d+[xX]\(.*?\)\s*/, "") // Remove pack size prefix like "8X(12X140ml)"
    .replace(/\s+\d+[xX].*$/, "") // Remove pack size suffix
    .replace(/\s*TH\s*$/, "") // Remove TH suffix
    .replace(/\s*FS\s*$/, "") // Remove FS suffix
    .replace(/\s*P12\s*$/, "") // Remove P12 suffix
    .replace(/\s*10B\.\s*$/, "") // Remove 10B. suffix
    .replace(/\s*\(.*?\)\s*$/, "") // Remove parentheses at end
    .trim();
};

// Parse pack size to extract size and unit
const parsePackSize = (packSize: string): { size: string; unit: string } => {
  // Handle different pack size formats
  const cleanSize = packSize.replace(/[xX\(\)]/g, " ").trim();

  // Extract last meaningful part as size
  const parts = cleanSize.split(/\s+/).filter(Boolean);
  const lastPart = parts[parts.length - 1];

  // Extract unit
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

// Clean barcode
const cleanBarcode = (barcode: string): string => {
  if (!barcode || barcode === "-" || barcode === "nan") return "";
  return barcode.replace(/\s+/g, "").replace(/^0+/, ""); // Remove spaces and leading zeros
};

// Convert CSV row to Product
const csvRowToProduct = (row: CSVProductRow, index: number): Product | null => {
  try {
    const material = row.Material?.trim();
    const description = row.Description?.trim();
    const thaiDesc = row["Thai Desc."]?.trim();
    const packSize = row["Pack Size"]?.trim();
    const productGroup = row["Product Group"]?.trim();
    const barcodeEA = cleanBarcode(row["Bar Code EA"]);

    // Skip rows without essential data
    if (!material || !description || !barcodeEA) {
      console.warn(`Skipping row ${index}: Missing essential data`);
      return null;
    }

    const { size, unit } = parsePackSize(packSize);
    const brand = extractBrand(description, thaiDesc);
    const category =
      PRODUCT_GROUP_MAPPING[productGroup] || ProductCategory.OTHER;
    const shelfLife = parseInt(row["Shelflife (Months)"]) || 12;

    const product: Product = {
      id: material,
      barcode: barcodeEA,
      name: formatProductName(thaiDesc, description),
      name_en: description,
      category,
      brand,
      description: `${description} - ${thaiDesc}`,
      size,
      unit,
      price: undefined, // Not available in CSV
      currency: "THB",
      sku: material,
      nutrition_info: undefined,
      ingredients: undefined,
      allergens: undefined,
      storage_instructions: `อายุการเก็บ ${shelfLife} เดือน`,
      country_of_origin: "ไทย",
      barcode_type:
        barcodeEA.length === 13
          ? "EAN-13"
          : barcodeEA.length === 12
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

// Load and parse CSV data
let csvProducts: Product[] = [];
let csvLoaded = false;
let csvLoading = false;

export const loadCSVProducts = async (): Promise<Product[]> => {
  if (csvLoaded && csvProducts.length > 0) {
    console.log("📋 Using cached CSV products:", csvProducts.length);
    return csvProducts;
  }

  if (csvLoading) {
    console.log("⏳ CSV already loading...");
    // Wait for loading to complete
    while (csvLoading) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return csvProducts;
  }

  csvLoading = true;

  try {
    console.log("🔄 Loading CSV product data from file...");

    // Fetch CSV file from public directory
    const response = await fetch("/product_list_csv.csv");
    if (!response.ok) {
      throw new Error(
        `Failed to fetch CSV: ${response.status} ${response.statusText}`
      );
    }

    const csvText = await response.text();
    console.log("📄 CSV file loaded, size:", csvText.length, "characters");

    // Parse CSV using Papa Parse
    const parseResult = Papa.parse<CSVProductRow>(csvText, {
      header: true,
      skipEmptyLines: true,
      trimHeaders: true,
      transformHeader: (header) => header.trim(),
    });

    if (parseResult.errors && parseResult.errors.length > 0) {
      console.warn("⚠️ CSV parsing errors:", parseResult.errors);
    }

    console.log("📊 CSV parsed successfully:", parseResult.data.length, "rows");

    // Convert CSV rows to Product objects
    const products: Product[] = [];
    parseResult.data.forEach((row, index) => {
      const product = csvRowToProduct(row, index);
      if (product) {
        products.push(product);
      }
    });

    csvProducts = products;
    csvLoaded = true;
    csvLoading = false;

    console.log(
      "✅ CSV products loaded successfully:",
      products.length,
      "products"
    );
    console.log(
      "🏷️ Sample products:",
      products
        .slice(0, 3)
        .map((p) => ({ name: p.name, barcode: p.barcode, brand: p.brand }))
    );

    return products;
  } catch (error) {
    csvLoading = false;
    console.error("❌ Error loading CSV products:", error);
    throw error;
  }
};

// Helper function to normalize barcode
export const normalizeBarcode = (barcode: string): string => {
  return barcode.trim().replace(/[^0-9]/g, "");
};

// Enhanced barcode matching function
export const findProductByBarcode = async (
  inputBarcode: string
): Promise<Product | undefined> => {
  const products = await loadCSVProducts();
  const searchBarcode = normalizeBarcode(inputBarcode);

  console.log("🔍 Searching for barcode:", searchBarcode);
  console.log("📋 Total products available:", products.length);

  // Try exact match first
  let product = products.find(
    (product) => normalizeBarcode(product.barcode) === searchBarcode
  );

  // If not found, try partial matches (for different barcode formats)
  if (!product) {
    // Try matching last 12 digits (for 13-digit barcodes)
    if (searchBarcode.length >= 12) {
      const last12 = searchBarcode.slice(-12);
      product = products.find(
        (product) => normalizeBarcode(product.barcode).slice(-12) === last12
      );
    }

    // Try matching first 12 digits (for 14-digit barcodes)
    if (!product && searchBarcode.length >= 12) {
      const first12 = searchBarcode.slice(0, 12);
      product = products.find(
        (product) => normalizeBarcode(product.barcode).slice(0, 12) === first12
      );
    }

    // Try without leading zeros
    if (!product) {
      const withoutLeadingZeros = searchBarcode.replace(/^0+/, "");
      product = products.find(
        (product) =>
          normalizeBarcode(product.barcode).replace(/^0+/, "") ===
          withoutLeadingZeros
      );
    }

    // Try with leading zeros (pad to 13 digits)
    if (!product && searchBarcode.length < 13) {
      const padded = searchBarcode.padStart(13, "0");
      product = products.find(
        (product) => normalizeBarcode(product.barcode) === padded
      );
    }
  }

  if (product) {
    console.log("✅ Product found:", product.name, "Brand:", product.brand);
  } else {
    console.log("❌ No product found for barcode:", searchBarcode);
    console.log(
      "🔍 Available barcodes sample:",
      products.slice(0, 5).map((p) => p.barcode)
    );
  }

  return product;
};

export const searchProducts = async (params: {
  name?: string;
  category?: ProductCategory;
  brand?: string;
  status?: ProductStatus;
}): Promise<Product[]> => {
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
};

export const getProductsByCategory = async (
  category: ProductCategory
): Promise<Product[]> => {
  const products = await loadCSVProducts();
  return products.filter((product) => product.category === category);
};

export const getAllBrands = async (): Promise<string[]> => {
  const products = await loadCSVProducts();
  return [...new Set(products.map((product) => product.brand))];
};

export const getProductStats = async () => {
  const products = await loadCSVProducts();
  const totalProducts = products.length;
  const activeProducts = products.filter(
    (p) => p.status === ProductStatus.ACTIVE
  ).length;
  const categories = [...new Set(products.map((p) => p.category))].length;
  const brands = [...new Set(products.map((p) => p.brand))].length;

  return {
    totalProducts,
    activeProducts,
    categories,
    brands,
  };
};

// Debug function
export const debugBarcodeMatching = async () => {
  const products = await loadCSVProducts();
  console.log("📊 Barcode Debug Info:");
  products.slice(0, 10).forEach((product, index) => {
    console.log(
      `${index + 1}. ${product.name}: ${product.barcode} (${
        product.barcode.length
      } digits) - ${product.brand}`
    );
  });
};
