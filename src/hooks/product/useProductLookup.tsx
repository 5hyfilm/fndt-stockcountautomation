// Path: src/hooks/product/useProductLookup.tsx
// Updated with enhanced barcode type detection

"use client";

import { useState, useCallback } from "react";
import { Product, BarcodeType } from "../../types/product";
import {
  ProductWithMultipleBarcodes,
  BarcodeSearchResult,
} from "../../data/types/csvTypes";
import { loadCSVProducts } from "../../data/loaders/csvLoader";
import { CSVUtils, normalizeBarcode } from "../../data/utils/csvUtils";

interface UseProductLookupProps {
  onProductFound?: () => void;
}

// Helper function to safely extract error message
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
};

export const useProductLookup = (props?: UseProductLookupProps) => {
  const { onProductFound } = props || {};

  // ✅ UPDATED: State with enhanced barcode type support
  const [product, setProduct] = useState<ProductWithMultipleBarcodes | null>(
    null
  );
  const [detectedBarcodeType, setDetectedBarcodeType] =
    useState<BarcodeType | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState<boolean>(false);
  const [productError, setProductError] = useState<string | null>(null);
  const [lastDetectedCode, setLastDetectedCode] = useState<string>("");

  // ✅ NEW: Enhanced search result state
  const [searchResult, setSearchResult] = useState<BarcodeSearchResult | null>(
    null
  );

  // ✅ MAJOR UPDATE: Enhanced barcode lookup with type detection
  const updateBarcode = useCallback(
    async (barcode: string) => {
      const normalizedBarcode = normalizeBarcode(barcode);
      if (
        !normalizedBarcode ||
        normalizedBarcode === normalizeBarcode(lastDetectedCode)
      ) {
        return;
      }

      console.log("🔄 Barcode detection started:", {
        original: barcode,
        normalized: normalizedBarcode,
        previous: normalizeBarcode(lastDetectedCode),
      });

      setIsLoadingProduct(true);
      setProductError(null);
      setLastDetectedCode(normalizedBarcode);

      try {
        // ✅ NEW: Load products and search with type detection
        const products = await loadCSVProducts();
        console.log(`📋 Loaded ${products.length} products from CSV`);

        // ✅ Use enhanced search with barcode type detection
        const result = CSVUtils.searchByBarcode(products, normalizedBarcode);
        setSearchResult(result);

        if (result.found && result.product && result.detectedType) {
          // ✅ Product found with detected barcode type
          setProduct(result.product);
          setDetectedBarcodeType(result.detectedType);

          console.log("✅ Product found with type detection:", {
            name: result.product.name,
            materialCode: result.product.materialCode,
            detectedType: result.detectedType,
            scannedBarcode: result.scannedBarcode,
            matchedBarcode: result.matchedBarcode,
          });

          // Log available barcode types for this product
          const availableTypes = CSVUtils.getAvailableBarcodeTypes(
            result.product
          );
          console.log(
            `📦 Available barcode types: ${availableTypes.join(", ")}`
          );

          // 🔥 Notify parent component about successful detection
          if (onProductFound) {
            console.log("📷 Stopping camera after product found");
            onProductFound();
          }
        } else {
          // ✅ Product not found
          setProduct(null);
          setDetectedBarcodeType(null);
          setProductError(`ไม่พบข้อมูลสินค้าสำหรับบาร์โค้ด: ${barcode}`);

          console.log("❌ Product not found:", {
            scannedBarcode: result.scannedBarcode,
            normalizedBarcode: result.normalizedBarcode,
            totalProducts: products.length,
          });

          // 🔥 Still notify parent to show error state
          if (onProductFound) {
            console.log(
              "📷 Stopping camera after barcode detection (not found)"
            );
            onProductFound();
          }
        }
      } catch (error: unknown) {
        const errorMessage = getErrorMessage(error);
        console.error("❌ Error during product lookup:", error);

        setProduct(null);
        setDetectedBarcodeType(null);
        setSearchResult(null);
        setProductError(`เกิดข้อผิดพลาด: ${errorMessage}`);

        // 🔥 Notify parent even on error
        if (onProductFound) {
          console.log("📷 Stopping camera after error");
          onProductFound();
        }
      } finally {
        setIsLoadingProduct(false);
      }
    },
    [lastDetectedCode, onProductFound]
  );

  // ✅ UPDATED: Clear product with enhanced state
  const clearProduct = useCallback(() => {
    console.log("🧹 Clearing product data");
    setProduct(null);
    setDetectedBarcodeType(null);
    setProductError(null);
    setSearchResult(null);
  }, []);

  // ✅ UPDATED: Clear current detection session
  const clearCurrentDetection = useCallback(() => {
    console.log("🔄 Clearing current detection session");
    setLastDetectedCode("");
    clearProduct();
  }, [clearProduct]);

  // ✅ NEW: Get unit label for detected barcode type
  const getDetectedUnitLabel = useCallback((): string => {
    if (!detectedBarcodeType) return "หน่วย";

    switch (detectedBarcodeType) {
      case BarcodeType.EA:
        return "ชิ้น";
      case BarcodeType.DSP:
        return "แพ็ค";
      case BarcodeType.CS:
        return "ลัง";
      default:
        return "หน่วย";
    }
  }, [detectedBarcodeType]);

  // ✅ NEW: Get detected unit abbreviation
  const getDetectedUnitAbbr = useCallback((): string => {
    if (!detectedBarcodeType) return "UN";
    return detectedBarcodeType.toUpperCase();
  }, [detectedBarcodeType]);

  // ✅ NEW: Check if product has multiple barcode types
  const hasMultipleBarcodeTypes = useCallback((): boolean => {
    if (!product) return false;
    const availableTypes = CSVUtils.getAvailableBarcodeTypes(product);
    return availableTypes.length > 1;
  }, [product]);

  // ✅ NEW: Get all available barcode types for current product
  const getAvailableBarcodeTypes = useCallback((): BarcodeType[] => {
    if (!product) return [];
    return CSVUtils.getAvailableBarcodeTypes(product);
  }, [product]);

  // ✅ NEW: Debug information getter
  const getDebugInfo = useCallback(() => {
    return {
      lastDetectedCode,
      product: product
        ? {
            name: product.name,
            materialCode: product.materialCode,
            productGroup: product.productGroup,
          }
        : null,
      detectedBarcodeType,
      searchResult: searchResult
        ? {
            found: searchResult.found,
            detectedType: searchResult.detectedType,
            matchedBarcode: searchResult.matchedBarcode,
          }
        : null,
      availableBarcodeTypes: getAvailableBarcodeTypes(),
      isLoading: isLoadingProduct,
      error: productError,
    };
  }, [
    lastDetectedCode,
    product,
    detectedBarcodeType,
    searchResult,
    getAvailableBarcodeTypes,
    isLoadingProduct,
    productError,
  ]);

  return {
    // ✅ Core state
    product,
    detectedBarcodeType,
    isLoadingProduct,
    productError,
    lastDetectedCode,

    // ✅ Enhanced state
    searchResult,

    // ✅ Core actions
    updateBarcode,
    clearProduct,
    clearCurrentDetection,

    // ✅ NEW: Enhanced utility functions
    getDetectedUnitLabel,
    getDetectedUnitAbbr,
    hasMultipleBarcodeTypes,
    getAvailableBarcodeTypes,
    getDebugInfo,

    // ✅ NEW: Backward compatibility helpers
    // For components that expect the old Product type
    productCompat: product as Product | null,
    detectedBarcodeTypeCompat: detectedBarcodeType as
      | "ea"
      | "dsp"
      | "cs"
      | null,
  };
};
