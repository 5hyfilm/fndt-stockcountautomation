// src/hooks/inventory/useInventorySummary.tsx
"use client";

import { useMemo } from "react";
import { InventoryItem, InventorySummary } from "./types";

interface UseInventorySummaryProps {
  inventory: InventoryItem[];
}

export const useInventorySummary = ({
  inventory,
}: UseInventorySummaryProps) => {
  // Calculate inventory summary
  const summary: InventorySummary = useMemo(() => {
    const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);
    const totalProducts = inventory.length;

    const categories: Record<string, number> = {};
    const brands: Record<string, number> = {};

    let lastUpdate = "";

    inventory.forEach((item) => {
      // Count by category
      categories[item.category] =
        (categories[item.category] || 0) + item.quantity;

      // Count by brand
      brands[item.brand] = (brands[item.brand] || 0) + item.quantity;

      // Track latest update
      if (item.lastUpdated > lastUpdate) {
        lastUpdate = item.lastUpdated;
      }
    });

    return {
      totalItems,
      totalProducts,
      lastUpdate,
      categories,
      brands,
    };
  }, [inventory]);

  // Additional summary calculations
  const detailedStats = useMemo(() => {
    const stats = {
      // Basic counts
      totalItems: summary.totalItems,
      totalProducts: summary.totalProducts,

      // Category analysis
      categoriesCount: Object.keys(summary.categories).length,
      topCategory: Object.entries(summary.categories).reduce(
        (max, current) => (current[1] > max[1] ? current : max),
        ["", 0]
      ),

      // Brand analysis
      brandsCount: Object.keys(summary.brands).length,
      topBrand: Object.entries(summary.brands).reduce(
        (max, current) => (current[1] > max[1] ? current : max),
        ["", 0]
      ),

      // Barcode type distribution
      barcodeTypes: inventory.reduce((acc, item) => {
        const type = item.barcodeType || "unknown";
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),

      // Employee statistics
      addedByEmployees: inventory.reduce((acc, item) => {
        if (item.addedBy) {
          acc[item.addedBy] = (acc[item.addedBy] || 0) + item.quantity;
        }
        return acc;
      }, {} as Record<string, number>),

      // Branch statistics
      branches: inventory.reduce((acc, item) => {
        if (item.branchCode) {
          acc[item.branchCode] = (acc[item.branchCode] || 0) + item.quantity;
        }
        return acc;
      }, {} as Record<string, number>),

      // Time analysis
      lastUpdate: summary.lastUpdate,
      oldestUpdate: inventory.reduce(
        (oldest, item) =>
          item.lastUpdated < oldest ? item.lastUpdated : oldest,
        new Date().toISOString()
      ),

      // Quantity analysis
      averageQuantity:
        inventory.length > 0
          ? Math.round((summary.totalItems / inventory.length) * 100) / 100
          : 0,
      maxQuantity: Math.max(...inventory.map((item) => item.quantity), 0),
      minQuantity: Math.min(...inventory.map((item) => item.quantity), 0),
    };

    return stats;
  }, [inventory, summary]);

  // Get items that need attention (low stock, etc.)
  const getAttentionItems = useMemo(() => {
    return {
      lowStock: inventory.filter((item) => item.quantity <= 5),
      outOfStock: inventory.filter((item) => item.quantity === 0),
      highStock: inventory.filter((item) => item.quantity >= 100),
      recentlyAdded: inventory
        .filter((item) => {
          const addedTime = new Date(item.lastUpdated).getTime();
          const now = Date.now();
          const dayInMs = 24 * 60 * 60 * 1000;
          return now - addedTime < dayInMs;
        })
        .sort(
          (a, b) =>
            new Date(b.lastUpdated).getTime() -
            new Date(a.lastUpdated).getTime()
        ),
    };
  }, [inventory]);

  // Format summary for display
  const formatSummaryForDisplay = () => {
    return {
      overview: {
        totalProducts: detailedStats.totalProducts.toLocaleString(),
        totalItems: detailedStats.totalItems.toLocaleString(),
        categories: detailedStats.categoriesCount.toLocaleString(),
        brands: detailedStats.brandsCount.toLocaleString(),
      },
      highlights: {
        topCategory: detailedStats.topCategory[0] || "ไม่มีข้อมูล",
        topCategoryCount: detailedStats.topCategory[1].toLocaleString(),
        topBrand: detailedStats.topBrand[0] || "ไม่มีข้อมูล",
        topBrandCount: detailedStats.topBrand[1].toLocaleString(),
        averageQuantity: detailedStats.averageQuantity.toString(),
      },
      alerts: {
        lowStockCount: getAttentionItems.lowStock.length,
        outOfStockCount: getAttentionItems.outOfStock.length,
        recentlyAddedCount: getAttentionItems.recentlyAdded.length,
      },
    };
  };

  return {
    // Basic summary (for compatibility)
    summary,

    // Detailed statistics
    detailedStats,

    // Items needing attention
    attentionItems: getAttentionItems,

    // Formatted data for display
    displaySummary: formatSummaryForDisplay(),
  };
};
