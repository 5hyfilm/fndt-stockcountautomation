// src/hooks/useProductInfo.tsx - Improved version with better error handling and retry
"use client";

import { useState, useCallback, useEffect } from "react";
import { Product, ProductResponse } from "../types/product";

interface RetryOptions {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  backoffMultiplier: 2,
};

export const useProductInfo = () => {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSearchedBarcode, setLastSearchedBarcode] = useState<string>("");
  const [retryCount, setRetryCount] = useState(0);

  // Clear product info
  const clearProduct = useCallback(() => {
    setProduct(null);
    setError(null);
    setLastSearchedBarcode("");
    setRetryCount(0);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
    setRetryCount(0);
  }, []);

  // Normalize barcode for consistency
  const normalizeBarcode = useCallback((barcode: string): string => {
    return barcode.trim().replace(/[^0-9]/g, "");
  }, []);

  // Sleep function for retry delays
  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  // Fetch with retry mechanism
  const fetchWithRetry = async (
    url: string,
    options: RequestInit,
    retryOptions: RetryOptions
  ): Promise<Response> => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retryOptions.maxRetries; attempt++) {
      try {
        console.log(
          `🔄 Fetch attempt ${attempt + 1}/${
            retryOptions.maxRetries + 1
          } for ${url}`
        );

        const response = await fetch(url, {
          ...options,
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        // If response is ok or it's a client error (4xx), don't retry
        if (response.ok || (response.status >= 400 && response.status < 500)) {
          return response;
        }

        // Server error (5xx) - retry
        throw new Error(
          `Server error: ${response.status} ${response.statusText}`
        );
      } catch (err: any) {
        lastError = err;
        console.warn(`❌ Fetch attempt ${attempt + 1} failed:`, err.message);

        // Don't retry on certain errors
        if (
          err.name === "AbortError" ||
          err.name === "TypeError" ||
          err.message.includes("Failed to fetch") ||
          attempt === retryOptions.maxRetries
        ) {
          break;
        }

        // Wait before retrying (with exponential backoff)
        const delay =
          retryOptions.retryDelay *
          Math.pow(retryOptions.backoffMultiplier, attempt);
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await sleep(delay);

        setRetryCount(attempt + 1);
      }
    }

    throw lastError || new Error("Unknown fetch error");
  };

  // Fetch product by barcode
  const fetchProductByBarcode = useCallback(
    async (barcode: string, options: RetryOptions = DEFAULT_RETRY_OPTIONS) => {
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
      setRetryCount(0);
      setLastSearchedBarcode(normalizedBarcode);

      try {
        console.log("🔍 Fetching product for barcode:", normalizedBarcode);
        console.log("📏 Barcode length:", normalizedBarcode.length);

        const apiUrl = `/api/products/lookup?barcode=${encodeURIComponent(
          normalizedBarcode
        )}`;

        const response = await fetchWithRetry(
          apiUrl,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-cache",
            },
          },
          options
        );

        console.log("📡 API Response status:", response.status);

        let result: ProductResponse;

        try {
          const responseText = await response.text();
          console.log(
            "📄 Raw response:",
            responseText.substring(0, 200) + "..."
          );

          result = JSON.parse(responseText);
        } catch (parseError) {
          console.error("❌ Failed to parse JSON response:", parseError);
          throw new Error("ไม่สามารถแปลงข้อมูลจาก API ได้");
        }

        console.log("📄 API Result:", {
          success: result.success,
          hasData: !!result.data,
          error: result.error,
          debug: result.debug,
        });

        if (response.ok && result.success && result.data) {
          console.log("✅ Product found:", result.data.name);
          setProduct(result.data);
          setError(null);
          setRetryCount(0);
        } else {
          console.log("❌ Product not found or API error:", result.error);
          setProduct(null);

          // Show debug info if available
          if (result.debug) {
            console.log("🐛 Debug info:", result.debug);
          }

          // Handle different error cases
          let errorMessage = result.error || "ไม่พบข้อมูลสินค้า";

          if (response.status === 404) {
            errorMessage = "ไม่พบข้อมูลสินค้าในระบบ";
          } else if (response.status === 500) {
            errorMessage = "เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง";
          } else if (response.status === 503) {
            errorMessage = "ระบบข้อมูลสินค้าไม่พร้อมใช้งาน";
          } else if (response.status === 504) {
            errorMessage = "ระบบประมวลผลช้า กรุณารอสักครู่";
          }

          // Show retry count if there were retries
          if (retryCount > 0) {
            errorMessage += ` (ลองใหม่ ${retryCount} ครั้ง)`;
          }

          setError(errorMessage);
        }
      } catch (err: any) {
        console.error("❌ Error fetching product:", err);
        setProduct(null);

        // Handle different types of errors
        let errorMessage = "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";

        if (err.name === "AbortError") {
          errorMessage = "การเชื่อมต่อใช้เวลานานเกินไป กรุณาลองใหม่";
        } else if (err.name === "TypeError" && err.message.includes("fetch")) {
          errorMessage = "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้";
        } else if (err.message.includes("Server error")) {
          errorMessage = "เซิร์ฟเวอร์มีปัญหา กรุณาลองใหม่ในภายหลัง";
        } else if (err.message.includes("Network")) {
          errorMessage = "ปัญหาการเชื่อมต่ออินเทอร์เน็ต";
        } else if (err.message) {
          errorMessage = `เกิดข้อผิดพลาด: ${err.message}`;
        }

        // Show retry count if there were retries
        if (retryCount > 0) {
          errorMessage += ` (ลองใหม่ ${retryCount} ครั้ง)`;
        }

        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [lastSearchedBarcode, normalizeBarcode, retryCount]
  );

  // Manual retry function
  const retryFetch = useCallback(() => {
    if (lastSearchedBarcode) {
      console.log("🔄 Manual retry for barcode:", lastSearchedBarcode);
      setLastSearchedBarcode(""); // Reset to force refetch
      fetchProductByBarcode(lastSearchedBarcode);
    }
  }, [lastSearchedBarcode, fetchProductByBarcode]);

  // Auto-fetch when barcode changes with debouncing
  const updateBarcode = useCallback(
    (barcode: string) => {
      const normalizedBarcode = normalizeBarcode(barcode);
      const lastNormalized = normalizeBarcode(lastSearchedBarcode);

      if (normalizedBarcode && normalizedBarcode !== lastNormalized) {
        console.log("🔄 Barcode changed:", {
          old: lastNormalized,
          new: normalizedBarcode,
        });

        // Clear previous error when starting new search
        setError(null);

        // Add a small delay to prevent too many rapid calls (debouncing)
        const timeoutId = setTimeout(() => {
          fetchProductByBarcode(normalizedBarcode);
        }, 300);

        // Cleanup function to cancel if another barcode comes quickly
        return () => clearTimeout(timeoutId);
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

  // Auto-retry on certain errors (optional)
  useEffect(() => {
    if (error && retryCount < DEFAULT_RETRY_OPTIONS.maxRetries) {
      const shouldAutoRetry =
        error.includes("เซิร์ฟเวอร์มีปัญหา") ||
        error.includes("ระบบประมวลผลช้า") ||
        error.includes("การเชื่อมต่อใช้เวลานานเกินไป");

      if (shouldAutoRetry && lastSearchedBarcode) {
        console.log("🔄 Auto-retrying due to server error...");
        const retryDelay = 2000 + retryCount * 1000; // 2s, 3s, 4s delays

        const timeoutId = setTimeout(() => {
          retryFetch();
        }, retryDelay);

        return () => clearTimeout(timeoutId);
      }
    }
  }, [error, retryCount, lastSearchedBarcode, retryFetch]);

  return {
    // State
    product,
    isLoading,
    error,
    lastSearchedBarcode,
    retryCount,

    // Actions
    fetchProductByBarcode,
    updateBarcode,
    clearProduct,
    clearError,
    retryFetch,
  };
};

// Hook สำหรับจัดการรายการสินค้าทั้งหมด (with improved error handling)
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
          `/api/products?${searchParams.toString()}`,
          {
            signal: AbortSignal.timeout(15000), // 15 second timeout
            headers: {
              "Cache-Control": "no-cache",
            },
          }
        );

        let result;
        try {
          result = await response.json();
        } catch (parseError) {
          throw new Error("ไม่สามารถแปลงข้อมูลจาก API ได้");
        }

        if (response.ok && result.success) {
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

        if (err.name === "AbortError") {
          setError("การเชื่อมต่อใช้เวลานานเกินไป");
        } else if (err.name === "TypeError" && err.message.includes("fetch")) {
          setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
        } else {
          setError(`เกิดข้อผิดพลาด: ${err.message}`);
        }
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
