// src/hooks/useProductInfo.tsx
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

  // Fetch product by barcode
  const fetchProductByBarcode = useCallback(
    async (barcode: string) => {
      if (!barcode || barcode === lastSearchedBarcode) {
        return;
      }

      setIsLoading(true);
      setError(null);
      setLastSearchedBarcode(barcode);

      try {
        console.log("🔍 Fetching product for barcode:", barcode);

        const response = await fetch(
          `/api/products/lookup?barcode=${encodeURIComponent(barcode)}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const result: ProductResponse = await response.json();

        if (result.success && result.data) {
          console.log("✅ Product found:", result.data.name);
          setProduct(result.data);
          setError(null);
        } else {
          console.log("❌ Product not found:", result.error);
          setProduct(null);
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
    [lastSearchedBarcode]
  );

  // Auto-fetch when barcode changes
  const updateBarcode = useCallback(
    (barcode: string) => {
      if (barcode && barcode !== lastSearchedBarcode) {
        fetchProductByBarcode(barcode);
      }
    },
    [fetchProductByBarcode, lastSearchedBarcode]
  );

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
