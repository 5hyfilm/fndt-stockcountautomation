// ./src/hooks/product/useProductLookup.tsx
"use client";

import { useState, useCallback } from "react";
import { Product } from "../../types/product";
import { findProductByBarcode, normalizeBarcode } from "../../data/csvProducts";

interface UseProductLookupProps {
  onProductFound?: () => void; // เพิ่ม callback เมื่อเจอสินค้า
}

// Define proper error type instead of using any
interface ProductLookupError {
  message: string;
  name?: string;
  code?: string;
  cause?: unknown;
}

// Type guard to check if error has message property
const isErrorWithMessage = (error: unknown): error is ProductLookupError => {
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

  return "เกิดข้อผิดพลาดในการค้นหาสินค้า";
};

export const useProductLookup = (props?: UseProductLookupProps) => {
  const { onProductFound } = props || {};

  // State - แก้ไข syntax error
  const [product, setProduct] = useState<Product | null>(null);
  const [detectedBarcodeType, setDetectedBarcodeType] = useState<
    "ea" | "dsp" | "cs" | null
  >(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState<boolean>(false);
  const [productError, setProductError] = useState<string | null>(null);
  const [lastDetectedCode, setLastDetectedCode] = useState<string>("");

  // Update barcode and fetch product info
  const updateBarcode = useCallback(
    async (barcode: string) => {
      const normalizedBarcode = normalizeBarcode(barcode);
      if (
        !normalizedBarcode ||
        normalizedBarcode === normalizeBarcode(lastDetectedCode)
      ) {
        return;
      }

      console.log("🔄 Barcode changed:", {
        old: normalizeBarcode(lastDetectedCode),
        new: normalizedBarcode,
      });

      setIsLoadingProduct(true);
      setProductError(null);

      try {
        // ใช้ findProductByBarcode ที่ return barcode type
        const result = await findProductByBarcode(normalizedBarcode);
        if (result) {
          setProduct(result.product);
          setDetectedBarcodeType(result.barcodeType);
          setLastDetectedCode(normalizedBarcode);
          console.log(
            `✅ Product found: ${
              result.product.name
            } (${result.barcodeType.toUpperCase()})`
          );

          // 🔥 เรียก callback เพื่อปิดกล้องเมื่อเจอสินค้า
          if (onProductFound) {
            console.log("📷 Stopping camera after product found");
            onProductFound();
          }
        } else {
          setProduct(null);
          setDetectedBarcodeType(null);
          setProductError("ไม่พบข้อมูลสินค้าในระบบ");
          console.log("❌ Product not found for barcode:", normalizedBarcode);
        }
      } catch (error: unknown) {
        // ✅ Fixed: Changed from 'any' to 'unknown'
        const errorMessage = getErrorMessage(error);
        console.error("❌ Error fetching product:", error);
        setProduct(null);
        setDetectedBarcodeType(null);
        setProductError(errorMessage);
      } finally {
        setIsLoadingProduct(false);
      }
    },
    [lastDetectedCode, onProductFound] // เพิ่ม onProductFound ใน dependency
  );

  // Clear product
  const clearProduct = useCallback(() => {
    setProduct(null);
    setDetectedBarcodeType(null);
    setProductError(null);
  }, []);

  // Clear current detection
  const clearCurrentDetection = useCallback(() => {
    setLastDetectedCode("");
    clearProduct();
  }, [clearProduct]);

  return {
    // State
    product,
    detectedBarcodeType,
    isLoadingProduct,
    productError,
    lastDetectedCode,
    // Actions
    updateBarcode,
    clearProduct,
    clearCurrentDetection,
  };
};
