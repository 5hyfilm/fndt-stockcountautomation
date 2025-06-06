// src/hooks/useProductInfo.tsx - Enhanced version
"use client";

import { useState, useCallback, useEffect } from "react";
import { Product, ProductResponse } from "../types/product";

export const useProductInfo = () => {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSearchedBarcode, setLastSearchedBarcode] = useState<string>("");

  // Clear product info
  const clearProduct = useCallback(() => {
    setProduct(null);
    setError(null);
    setLastSearchedBarcode("");
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Normalize barcode for consistency
  const normalizeBarcode = useCallback((barcode: string): string => {
    return barcode.trim().replace(/[^0-9]/g, "");
  }, []);

  // Fetch product by barcode
  const fetchProductByBarcode = useCallback(
    async (barcode: string) => {
      const normalizedBarcode = normalizeBarcode(barcode);

      if (
        !normalizedBarcode ||
        normalizedBarcode === normalizeBarcode(lastSearchedBarcode)
      ) {
        console.log(
          "🔄 Skipping fetch - same barcode or empty:",
          normalizedBarcode
        );
        return;
      }

      setIsLoading(true);
      setError(null);
      setLastSearchedBarcode(normalizedBarcode);

      try {
        console.log("🔍 Fetching product for barcode:", normalizedBarcode);
        console.log("📏 Barcode length:", normalizedBarcode.length);

        const response = await fetch(
          `/api/products/lookup?barcode=${encodeURIComponent(
            normalizedBarcode
          )}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        console.log("📡 API Response status:", response.status);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result: ProductResponse = await response.json();
        console.log("📄 API Result:", result);

        if (result.success && result.data) {
          console.log("✅ Product found:", result.data.name);
          setProduct(result.data);
          setError(null);
        } else {
          console.log("❌ Product not found:", result.error);
          setProduct(null);

          // Show debug info if available
          if (result.debug) {
            console.log("🐛 Debug info:", result.debug);
          }

          setError(result.error || "ไม่พบข้อมูลสินค้า");
        }
      } catch (err: any) {
        console.error("❌ Error fetching product:", err);
        setProduct(null);
        setError(`เกิดข้อผิดพลาดในการค้นหาสินค้า: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    },
    [lastSearchedBarcode, normalizeBarcode]
  );

  // Auto-fetch when barcode changes
  const updateBarcode = useCallback(
    (barcode: string) => {
      const normalizedBarcode = normalizeBarcode(barcode);
      const lastNormalized = normalizeBarcode(lastSearchedBarcode);

      if (normalizedBarcode && normalizedBarcode !== lastNormalized) {
        console.log("🔄 Barcode changed:", {
          old: lastNormalized,
          new: normalizedBarcode,
        });
        fetchProductByBarcode(normalizedBarcode);
      }
    },
    [fetchProductByBarcode, lastSearchedBarcode, normalizeBarcode]
  );

  // Debug log when product changes
  useEffect(() => {
    if (product) {
      console.log("🎯 Product updated:", {
        name: product.name,
        barcode: product.barcode,
        brand: product.brand,
      });
    }
  }, [product]);

  return {
    // State
    product,
    isLoading,
    error,
    lastSearchedBarcode,

    // Actions
    fetchProductByBarcode,
    updateBarcode,
    clearProduct,
    clearError,
  };
};

// Hook สำหรับจัดการรายการสินค้าทั้งหมด
export const useProductList = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchProducts = useCallback(
    async (params?: {
      name?: string;
      category?: string;
      brand?: string;
      limit?: number;
      offset?: number;
    }) => {
      setIsLoading(true);
      setError(null);

      try {
        const searchParams = new URLSearchParams();

        if (params?.name) searchParams.set("name", params.name);
        if (params?.category) searchParams.set("category", params.category);
        if (params?.brand) searchParams.set("brand", params.brand);
        if (params?.limit) searchParams.set("limit", params.limit.toString());
        if (params?.offset)
          searchParams.set("offset", params.offset.toString());

        const response = await fetch(
          `/api/products?${searchParams.toString()}`
        );
        const result = await response.json();

        if (result.success) {
          setProducts(result.data || []);
          setTotal(result.total || 0);
          setError(null);
        } else {
          setProducts([]);
          setError(result.error || "เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า");
        }
      } catch (err: any) {
        console.error("Error fetching products:", err);
        setProducts([]);
        setError(`เกิดข้อผิดพลาด: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const searchProducts = useCallback(
    (searchTerm: string) => {
      fetchProducts({ name: searchTerm });
    },
    [fetchProducts]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    products,
    isLoading,
    error,
    total,

    // Actions
    fetchProducts,
    searchProducts,
    clearError,
  };
};
