// Path: src/data/services/productServices.ts
// Updated with enhanced barcode type detection using CSVUtils

import {
  ProductCategory,
  ProductStatus,
  BarcodeType,
} from "../../types/product";
import {
  ProductWithMultipleBarcodes,
  BarcodeSearchResult,
  CSVUtils,
} from "../types/csvTypes";
import { loadCSVProducts } from "../loaders/csvLoader";

// ✅ MAJOR UPDATE: Enhanced barcode matching using CSVUtils
export const findProductByBarcode = async (
  inputBarcode: string
): Promise<
  { product: ProductWithMultipleBarcodes; barcodeType: BarcodeType } | undefined
> => {
  try {
    console.log("🔍 Product lookup started:", inputBarcode);

    // Load products from CSV
    const products = await loadCSVProducts();
    console.log(`📋 Loaded ${products.length} products from CSV`);

    // ✅ Use enhanced search with barcode type detection
    const result: BarcodeSearchResult = CSVUtils.searchByBarcode(
      products,
      inputBarcode
    );

    if (result.found && result.product && result.detectedType) {
      console.log("✅ Product found via productServices:", {
        name: result.product.name,
        materialCode: result.product.materialCode,
        detectedType: result.detectedType,
        matchedBarcode: result.matchedBarcode,
      });

      // Log available barcode types
      const availableTypes = CSVUtils.getAvailableBarcodeTypes(result.product);
      console.log(`📦 Available types: ${availableTypes.join(", ")}`);

      return {
        product: result.product,
        barcodeType: result.detectedType,
      };
    }

    console.log("❌ No product found for barcode:", inputBarcode);
    return undefined;
  } catch (error) {
    console.error("❌ Error in findProductByBarcode:", error);
    throw error;
  }
};

// ✅ NEW: Find product by specific barcode type
export const findProductByBarcodeAndType = async (
  inputBarcode: string,
  barcodeType: BarcodeType
): Promise<ProductWithMultipleBarcodes | undefined> => {
  try {
    const products = await loadCSVProducts();
    const normalized = CSVUtils.normalizeBarcode(inputBarcode);

    for (const product of products) {
      const barcode = CSVUtils.getBarcodeByType(product, barcodeType);
      if (barcode && CSVUtils.normalizeBarcode(barcode) === normalized) {
        console.log(
          `✅ Found product by specific type ${barcodeType}:`,
          product.name
        );
        return {
          ...product,
          barcodes: {
            ...product.barcodes,
            scannedType: barcodeType,
          },
          detectedBarcodeType: barcodeType,
        };
      }
    }

    return undefined;
  } catch (error) {
    console.error(`❌ Error finding product by ${barcodeType}:`, error);
    throw error;
  }
};

// ✅ NEW: Get all barcode matches (for debugging)
export const findAllBarcodeMatches = async (
  inputBarcode: string
): Promise<
  Array<{ product: ProductWithMultipleBarcodes; barcodeType: BarcodeType }>
> => {
  try {
    const products = await loadCSVProducts();
    const normalized = CSVUtils.normalizeBarcode(inputBarcode);
    const matches: Array<{
      product: ProductWithMultipleBarcodes;
      barcodeType: BarcodeType;
    }> = [];

    for (const product of products) {
      // Check each barcode type
      for (const type of [BarcodeType.EA, BarcodeType.DSP, BarcodeType.CS]) {
        const barcode = CSVUtils.getBarcodeByType(product, type);
        if (barcode && CSVUtils.normalizeBarcode(barcode) === normalized) {
          matches.push({
            product: {
              ...product,
              barcodes: {
                ...product.barcodes,
                scannedType: type,
              },
              detectedBarcodeType: type,
            },
            barcodeType: type,
          });
        }
      }
    }

    return matches;
  } catch (error) {
    console.error("❌ Error finding all matches:", error);
    throw error;
  }
};

// ✅ UPDATED: Search products with filters (enhanced)
export const searchProducts = async (params: {
  name?: string;
  category?: ProductCategory;
  brand?: string;
  status?: ProductStatus;
  productGroup?: string;
  materialCode?: string;
  barcodeType?: BarcodeType;
}): Promise<ProductWithMultipleBarcodes[]> => {
  try {
    const products = await loadCSVProducts();

    return products.filter((product) => {
      // Name filter
      if (params.name) {
        const searchTerm = params.name.toLowerCase();
        const nameMatch = product.name.toLowerCase().includes(searchTerm);
        const thaiMatch = product.description
          ?.toLowerCase()
          .includes(searchTerm);
        const materialMatch = product.materialCode
          ?.toLowerCase()
          .includes(searchTerm);

        if (!nameMatch && !thaiMatch && !materialMatch) {
          return false;
        }
      }

      // Category filter
      if (params.category && product.category !== params.category) {
        return false;
      }

      // Brand filter
      if (params.brand && product.brand !== params.brand) {
        return false;
      }

      // Status filter
      if (params.status && product.status !== params.status) {
        return false;
      }

      // ✅ NEW: Product group filter
      if (params.productGroup && product.productGroup !== params.productGroup) {
        return false;
      }

      // ✅ NEW: Material code filter
      if (params.materialCode && product.materialCode !== params.materialCode) {
        return false;
      }

      // ✅ NEW: Barcode type filter (products that have this barcode type)
      if (params.barcodeType) {
        const availableTypes = CSVUtils.getAvailableBarcodeTypes(product);
        if (!availableTypes.includes(params.barcodeType)) {
          return false;
        }
      }

      return true;
    });
  } catch (error) {
    console.error("❌ Error searching products:", error);
    throw error;
  }
};

// Get products by category
export const getProductsByCategory = async (
  category: ProductCategory
): Promise<ProductWithMultipleBarcodes[]> => {
  return searchProducts({ category });
};

// ✅ NEW: Get products by product group
export const getProductsByGroup = async (
  productGroup: string
): Promise<ProductWithMultipleBarcodes[]> => {
  return searchProducts({ productGroup });
};

// Get all brands
export const getAllBrands = async (): Promise<string[]> => {
  try {
    const products = await loadCSVProducts();
    const brands = [...new Set(products.map((product) => product.brand))];
    return brands.sort();
  } catch (error) {
    console.error("❌ Error getting brands:", error);
    throw error;
  }
};

// ✅ NEW: Get all product groups
export const getAllProductGroups = async (): Promise<string[]> => {
  try {
    const products = await loadCSVProducts();
    const groups = [
      ...new Set(products.map((product) => product.productGroup)),
    ];
    return groups.sort();
  } catch (error) {
    console.error("❌ Error getting product groups:", error);
    throw error;
  }
};

// ✅ ENHANCED: Get comprehensive product statistics
export const getProductStats = async () => {
  try {
    const products = await loadCSVProducts();

    // Basic stats
    const totalProducts = products.length;
    const activeProducts = products.filter(
      (p) => p.status === ProductStatus.ACTIVE
    ).length;
    const categories = [...new Set(products.map((p) => p.category))].length;
    const brands = [...new Set(products.map((p) => p.brand))].length;
    const productGroups = [...new Set(products.map((p) => p.productGroup))]
      .length;

    // ✅ Enhanced barcode type statistics
    const barcodeStats = {
      withEA: products.filter((p) => CSVUtils.isValidBarcode(p.barcodes.ea))
        .length,
      withDSP: products.filter((p) => CSVUtils.isValidBarcode(p.barcodes.dsp))
        .length,
      withCS: products.filter((p) => CSVUtils.isValidBarcode(p.barcodes.cs))
        .length,
    };

    // ✅ Barcode type combinations
    const typeCombinations = {
      allThreeTypes: products.filter(
        (p) =>
          CSVUtils.isValidBarcode(p.barcodes.ea) &&
          CSVUtils.isValidBarcode(p.barcodes.dsp) &&
          CSVUtils.isValidBarcode(p.barcodes.cs)
      ).length,
      onlyEA: products.filter(
        (p) =>
          CSVUtils.isValidBarcode(p.barcodes.ea) &&
          !CSVUtils.isValidBarcode(p.barcodes.dsp) &&
          !CSVUtils.isValidBarcode(p.barcodes.cs)
      ).length,
      onlyDSP: products.filter(
        (p) =>
          !CSVUtils.isValidBarcode(p.barcodes.ea) &&
          CSVUtils.isValidBarcode(p.barcodes.dsp) &&
          !CSVUtils.isValidBarcode(p.barcodes.cs)
      ).length,
      onlyCS: products.filter(
        (p) =>
          !CSVUtils.isValidBarcode(p.barcodes.ea) &&
          !CSVUtils.isValidBarcode(p.barcodes.dsp) &&
          CSVUtils.isValidBarcode(p.barcodes.cs)
      ).length,
    };

    // ✅ Product group distribution
    const groupDistribution: Record<string, number> = {};
    products.forEach((p) => {
      groupDistribution[p.productGroup] =
        (groupDistribution[p.productGroup] || 0) + 1;
    });

    const stats = {
      totalProducts,
      activeProducts,
      categories,
      brands,
      productGroups,
      barcodeStats,
      typeCombinations,
      groupDistribution,
    };

    console.log("📊 Enhanced Product Statistics:", stats);
    return stats;
  } catch (error) {
    console.error("❌ Error getting product stats:", error);
    throw error;
  }
};

// ✅ NEW: Validate product data integrity
export const validateProductData = async (): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: any;
}> => {
  try {
    const products = await loadCSVProducts();
    const errors: string[] = [];
    const warnings: string[] = [];

    let productsWithoutBarcodes = 0;
    let duplicateMaterialCodes = 0;
    let productsWithOnlyOneBarcode = 0;

    // Check for data integrity issues
    const materialCodes = new Set<string>();

    products.forEach((product, index) => {
      // Check for missing material codes
      if (!product.materialCode) {
        errors.push(`Product ${index}: Missing material code`);
      } else if (materialCodes.has(product.materialCode)) {
        duplicateMaterialCodes++;
        warnings.push(`Duplicate material code: ${product.materialCode}`);
      } else {
        materialCodes.add(product.materialCode);
      }

      // Check for barcode coverage
      const availableTypes = CSVUtils.getAvailableBarcodeTypes(product);
      if (availableTypes.length === 0) {
        productsWithoutBarcodes++;
        errors.push(`Product ${product.materialCode}: No valid barcodes`);
      } else if (availableTypes.length === 1) {
        productsWithOnlyOneBarcode++;
        warnings.push(
          `Product ${product.materialCode}: Only one barcode type (${availableTypes[0]})`
        );
      }

      // Check for missing required fields
      if (!product.name || !product.productGroup) {
        errors.push(`Product ${product.materialCode}: Missing required fields`);
      }
    });

    const stats = {
      totalProducts: products.length,
      productsWithoutBarcodes,
      duplicateMaterialCodes,
      productsWithOnlyOneBarcode,
      uniqueMaterialCodes: materialCodes.size,
    };

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      stats,
    };
  } catch (error) {
    console.error("❌ Error validating product data:", error);
    return {
      isValid: false,
      errors: [`Validation failed: ${error}`],
      warnings: [],
      stats: {},
    };
  }
};
