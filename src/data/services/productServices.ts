// src/data/services/productServices.ts
import { Product, ProductCategory, ProductStatus } from "../../types/product";
import { ProductWithMultipleBarcodes, UNIT_TYPES } from "../types/csvTypes";
import { normalizeBarcode } from "../utils/csvUtils";
import { findBarcodeMatch } from "../matchers/barcodeMatcher";
import { loadCSVProducts } from "../loaders/csvLoader";
import {
  FALLBACK_PRODUCTS,
  findFallbackProductByBarcode,
  getFallbackStats,
} from "../fallbackProducts";

// Enhanced barcode matching function with multi-barcode support
export const findProductByBarcode = async (
  inputBarcode: string
): Promise<
  | { product: ProductWithMultipleBarcodes; barcodeType: "ea" | "dsp" | "cs" }
  | undefined
> => {
  try {
    const products = await loadCSVProducts();
    const searchBarcode = normalizeBarcode(inputBarcode);

    console.log("🔍 Searching for barcode:", searchBarcode);
    console.log("📋 Total products available:", products.length);

    for (const product of products) {
      const match = findBarcodeMatch(searchBarcode, product);

      if (match.matched && match.type) {
        console.log(
          `✅ Product found: ${product.name} (${match.type?.toUpperCase()}: ${
            match.barcode
          })`
        );
        console.log(`📦 Unit type: ${UNIT_TYPES[match.type!]}`);

        // Add scanned type to the product for reference
        const resultProduct: ProductWithMultipleBarcodes = {
          ...product,
          barcodes: {
            ...product.barcodes,
            scannedType: match.type,
          },
        };

        // For compatibility, keep the matched barcode as the main barcode
        resultProduct.barcode = match.barcode!;

        return {
          product: resultProduct,
          barcodeType: match.type,
        };
      }
    }

    console.log("❌ No product found for barcode:", searchBarcode);
    return undefined;
  } catch (error) {
    console.warn("⚠️ Error in CSV search, trying fallback:", error);
    const fallbackResult = findFallbackProductByBarcode(inputBarcode);
    if (fallbackResult) {
      // Convert fallback result to match our interface
      const convertedProduct: ProductWithMultipleBarcodes = {
        ...fallbackResult.product,
        barcodes: {
          primary: fallbackResult.product.barcode,
          ea: fallbackResult.product.barcode,
        },
        packSize: 1,
      };
      return {
        product: convertedProduct,
        barcodeType: fallbackResult.barcodeType,
      };
    }
    return undefined;
  }
};

// Search products with filters
export const searchProducts = async (params: {
  name?: string;
  category?: ProductCategory;
  brand?: string;
  status?: ProductStatus;
}): Promise<ProductWithMultipleBarcodes[]> => {
  try {
    const products = await loadCSVProducts();

    return products.filter((product) => {
      if (
        params.name &&
        !product.name.toLowerCase().includes(params.name.toLowerCase())
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
    // Convert fallback products to our interface
    return FALLBACK_PRODUCTS.filter((product) => {
      if (
        params.name &&
        !product.name.toLowerCase().includes(params.name.toLowerCase())
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
    }).map((product) => ({
      ...product,
      barcodes: {
        primary: product.barcode,
        ea: product.barcode,
      },
      packSize: 1,
    }));
  }
};

export const getProductsByCategory = async (
  category: ProductCategory
): Promise<ProductWithMultipleBarcodes[]> => {
  try {
    const products = await loadCSVProducts();
    return products.filter((product) => product.category === category);
  } catch (error) {
    console.warn("⚠️ Using fallback products for category search:", error);
    return FALLBACK_PRODUCTS.filter(
      (product) => product.category === category
    ).map((product) => ({
      ...product,
      barcodes: {
        primary: product.barcode,
        ea: product.barcode,
      },
      packSize: 1,
    }));
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
