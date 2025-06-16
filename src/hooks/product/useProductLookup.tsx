// src/hooks/product/useProductLookup.tsx - Enhanced with Manual Product Support
import { useState, useCallback } from "react";
import { Product } from "../../types/product";
import { findProductByBarcode } from "../../data/services/productServices";
import { normalizeBarcode } from "../../data/utils/csvUtils";

// ===== TYPES =====
interface UseProductLookupProps {
  onProductFound?: () => void;
  onProductAdded?: (product: any) => void; // เพิ่มสำหรับ manual product addition
}

interface UseProductLookupReturn {
  // State
  product: Product | null;
  detectedBarcodeType: "ea" | "dsp" | "cs" | null;
  isLoadingProduct: boolean;
  productError: string | null;
  lastDetectedCode: string;

  // Actions
  updateBarcode: (barcode: string) => Promise<void>;
  clearProduct: () => void;
  clearCurrentDetection: () => void;
  handleProductAdded: (newProduct: any) => void; // เพิ่มสำหรับ manual product
}

// Helper function to get error message from unknown error type
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
};

// ===== MAIN HOOK =====
export const useProductLookup = (
  props?: UseProductLookupProps
): UseProductLookupReturn => {
  const { onProductFound, onProductAdded } = props || {};

  // State
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

          // เรียก callback เพื่อปิดกล้องเมื่อเจอสินค้า
          if (onProductFound) {
            console.log("📷 Stopping camera after product found");
            onProductFound();
          }
        } else {
          setProduct(null);
          setDetectedBarcodeType(null);
          setProductError("ไม่พบข้อมูลสินค้าในระบบ");
          setLastDetectedCode(normalizedBarcode); // ยังคง barcode ไว้สำหรับ manual addition
          console.log("❌ Product not found for barcode:", normalizedBarcode);
        }
      } catch (error: unknown) {
        const errorMessage = getErrorMessage(error);
        console.error("❌ Error fetching product:", error);
        setProduct(null);
        setDetectedBarcodeType(null);
        setProductError(errorMessage);
        setLastDetectedCode(normalizedBarcode); // ยังคง barcode ไว้สำหรับ manual addition
      } finally {
        setIsLoadingProduct(false);
      }
    },
    [lastDetectedCode, onProductFound]
  );

  // Handle manually added product
  const handleProductAdded = useCallback(
    (newProduct: any) => {
      console.log("🎉 Product added manually:", newProduct);

      // Update state with the new product
      setProduct(newProduct);
      setProductError(null);
      setDetectedBarcodeType(newProduct.barcodeType || "ea");

      // Call parent callback
      onProductAdded?.(newProduct);

      // Call onProductFound to trigger any UI updates (like closing camera)
      onProductFound?.();
    },
    [onProductAdded, onProductFound]
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
    handleProductAdded, // เพิ่มสำหรับ manual product addition
  };
};

export default useProductLookup;
