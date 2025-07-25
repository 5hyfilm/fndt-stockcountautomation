// src/hooks/product/useProductInfo.tsx
// 🔧 Updated to use consolidated error types

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Product,
  ProductInfoConfig,
  UseProductInfoReturn,
} from "../../types/product";
// ✅ Import from consolidated errors
import {
  isAppError,
  createProductError,
  ProductErrorCode,
  getUserFriendlyMessage,
} from "../../types/errors";
import { useProductCache } from "./useProductCache";
import { useProductFetcher } from "./useProductFetcher";
import { useProductValidator } from "./useProductValidator";

const DEFAULT_CONFIG: ProductInfoConfig = {
  enableCaching: true,
  cacheExpiryMs: 5 * 60 * 1000, // 5 minutes
  retryAttempts: 3,
  retryDelayMs: 1000,
  enableDebouncing: true,
  debounceDelayMs: 300,
};

/**
 * Enhanced product info hook with consolidated error handling
 */
export const useProductInfo = (
  config: ProductInfoConfig = DEFAULT_CONFIG
): UseProductInfoReturn => {
  // State
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSearchedBarcode, setLastSearchedBarcode] = useState<string>("");
  const [retryCount, setRetryCount] = useState(0);

  // ✅ Fix: Use useRef for debounce timeout
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sub-hooks
  const cache = useProductCache({
    enabled: config.enableCaching,
    expiryMs: config.cacheExpiryMs,
  });

  const fetcher = useProductFetcher({
    retryAttempts: config.retryAttempts,
    retryDelayMs: config.retryDelayMs,
    setRetryCount,
  });

  const validator = useProductValidator();

  // ✅ Enhanced error handling with consolidated error types
  const handleError = useCallback((error: unknown, barcode?: string) => {
    console.error("Product fetch error:", error);

    // Create appropriate product error
    let productError;

    if (isAppError(error)) {
      productError = error;
    } else if (error instanceof Error) {
      // Map common error types to product error codes
      if (error.message.includes("barcode")) {
        productError = createProductError(
          ProductErrorCode.INVALID_BARCODE,
          "บาร์โค้ดไม่ถูกต้อง",
          { barcode, cause: error }
        );
      } else if (error.message.includes("not found")) {
        productError = createProductError(
          ProductErrorCode.NOT_FOUND,
          "ไม่พบข้อมูลสินค้า",
          { barcode, cause: error }
        );
      } else {
        productError = createProductError(
          ProductErrorCode.FETCH_ERROR,
          "เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า",
          { barcode, cause: error }
        );
      }
    } else {
      productError = createProductError(
        ProductErrorCode.FETCH_ERROR,
        "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ",
        { barcode, cause: error }
      );
    }

    setError(getUserFriendlyMessage(productError));
  }, []);

  // ✅ Cleanup effect for debounce timeout
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearProduct = useCallback(() => {
    setProduct(null);
    setError(null);
    setLastSearchedBarcode("");
    setRetryCount(0);
  }, []);

  // ✅ Enhanced fetch function with better error handling
  const fetchProductByBarcode = useCallback(
    async (barcode: string) => {
      if (!barcode || barcode.trim() === "") {
        handleError(
          createProductError(
            ProductErrorCode.VALIDATION_ERROR,
            "กรุณาระบุบาร์โค้ด",
            { barcode }
          )
        );
        return;
      }

      // Validate barcode first
      const normalizedBarcode = validator.normalizeBarcode(barcode);
      const validation = validator.validateBarcode(normalizedBarcode);

      if (!validation.isValid) {
        handleError(
          createProductError(
            ProductErrorCode.INVALID_BARCODE,
            validation.errors.join(", "),
            {
              barcode: normalizedBarcode,
              context: {
                validationErrors: validation.errors,
                suggestions: validation.suggestions,
              },
            }
          )
        );
        return;
      }

      setIsLoading(true);
      setError(null);
      setLastSearchedBarcode(normalizedBarcode);

      try {
        // Check cache first
        if (config.enableCaching) {
          const cachedProduct = cache.get(normalizedBarcode);
          if (cachedProduct) {
            setProduct(cachedProduct);
            setIsLoading(false);
            setRetryCount(0);
            return;
          }
        }

        // Fetch from API
        const response = await fetcher.fetchProduct(normalizedBarcode);

        if (response.success && response.data) {
          const productData = response.data;
          setProduct(productData);

          // Cache the result
          if (config.enableCaching) {
            cache.set(normalizedBarcode, productData);
          }

          setRetryCount(0);
        } else {
          // API returned error
          handleError(
            createProductError(
              ProductErrorCode.NOT_FOUND,
              response.error || "ไม่พบข้อมูลสินค้า",
              {
                barcode: normalizedBarcode,
                context: {
                  apiResponse: response,
                  debug: response.debug,
                },
              }
            )
          );
        }
      } catch (fetchError) {
        // Network or other errors
        handleError(fetchError, normalizedBarcode);
      } finally {
        setIsLoading(false);
      }
    },
    [config, cache, fetcher, validator, handleError]
  );

  // ✅ Enhanced update barcode with debouncing
  const updateBarcode = useCallback(
    (barcode: string) => {
      if (!config.enableDebouncing) {
        fetchProductByBarcode(barcode);
        return;
      }

      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Set new timeout
      const timeout = setTimeout(() => {
        fetchProductByBarcode(barcode);
      }, config.debounceDelayMs);

      // ✅ Fix: Store timeout reference using useRef pattern
      debounceTimeoutRef.current = timeout;
    },
    [fetchProductByBarcode, config.enableDebouncing, config.debounceDelayMs]
  );

  // Retry fetch
  const retryFetch = useCallback(() => {
    if (lastSearchedBarcode) {
      fetchProductByBarcode(lastSearchedBarcode);
    }
  }, [fetchProductByBarcode, lastSearchedBarcode]);

  // Cache utilities
  const clearCache = useCallback(() => {
    cache.clear();
  }, [cache]);

  const getCacheStats = useCallback(() => {
    return cache.getStats();
  }, [cache]);

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

    // Cache utilities
    clearCache,
    getCacheStats,
  };
};
