// src/hooks/inventory/useInventorySummary.tsx - Phase 2: Enhanced Summary with Quantity Details
"use client";

import { useMemo } from "react";
import { InventoryItem, InventorySummary } from "./types";

interface UseInventorySummaryProps {
  inventory: InventoryItem[];
}

export const useInventorySummary = ({
  inventory,
}: UseInventorySummaryProps) => {
  // ✅ Enhanced summary calculations with quantity breakdown
  const summary: InventorySummary = useMemo(() => {
    if (inventory.length === 0) {
      return {
        totalItems: 0,
        totalProducts: 0,
        lastUpdate: "",
        categories: {},
        brands: {},
        quantityBreakdown: {
          totalEA: 0,
          totalDSP: 0,
          totalCS: 0,
          itemsWithDetail: 0,
        },
      };
    }

    // ✅ Basic counts
    const totalItems = inventory.length;
    const uniqueBarcodes = new Set(inventory.map((item) => item.barcode));
    const totalProducts = uniqueBarcodes.size;

    // ✅ Find most recent update
    const lastUpdate = inventory.reduce((latest, item) => {
      const itemDate = new Date(item.lastUpdated);
      const latestDate = new Date(latest);
      return itemDate > latestDate ? item.lastUpdated : latest;
    }, inventory[0]?.lastUpdated || "");

    // ✅ Category distribution
    const categories: Record<string, number> = {};
    inventory.forEach((item) => {
      const category = item.category || "ไม่ระบุ";
      categories[category] = (categories[category] || 0) + 1;
    });

    // ✅ Brand distribution
    const brands: Record<string, number> = {};
    inventory.forEach((item) => {
      const brand = item.brand || "ไม่ระบุ";
      brands[brand] = (brands[brand] || 0) + 1;
    });

    // ✅ Enhanced quantity breakdown
    let totalEA = 0;
    let totalDSP = 0;
    let totalCS = 0;
    let itemsWithDetail = 0;
    let totalRemainderItems = 0;

    inventory.forEach((item) => {
      if (item.quantityDetail) {
        itemsWithDetail++;
        const { major, remainder, scannedType } = item.quantityDetail;

        switch (scannedType) {
          case "ea":
            totalEA += major;
            break;
          case "dsp":
            totalDSP += major;
            break;
          case "cs":
            totalCS += major;
            break;
        }

        totalRemainderItems += remainder;
      } else {
        // Handle legacy format
        const barcodeType = item.barcodeType || "ea";
        switch (barcodeType) {
          case "ea":
            totalEA += item.quantity;
            break;
          case "dsp":
            totalDSP += item.quantity;
            break;
          case "cs":
            totalCS += item.quantity;
            break;
        }
      }
    });

    return {
      totalItems,
      totalProducts,
      lastUpdate,
      categories,
      brands,
      quantityBreakdown: {
        totalEA,
        totalDSP,
        totalCS,
        itemsWithDetail,
        totalRemainderItems, // ✅ New field
      },
    };
  }, [inventory]);

  // ✅ Additional computed values
  const computedStats = useMemo(() => {
    const { quantityBreakdown } = summary;

    return {
      // Percentage breakdowns
      detailCoverage:
        summary.totalItems > 0
          ? Math.round(
              ((quantityBreakdown?.itemsWithDetail || 0) / summary.totalItems) *
                100
            )
          : 0,

      // Quantity distribution percentages
      quantityDistribution: {
        ea: quantityBreakdown?.totalEA || 0,
        dsp: quantityBreakdown?.totalDSP || 0,
        cs: quantityBreakdown?.totalCS || 0,
      },

      // Category insights
      topCategory:
        Object.entries(summary.categories).sort(
          ([, a], [, b]) => b - a
        )[0]?.[0] || "",
      topBrand:
        Object.entries(summary.brands).sort(([, a], [, b]) => b - a)[0]?.[0] ||
        "",

      // Data quality metrics
      dataQuality: {
        hasQuantityDetail: quantityBreakdown?.itemsWithDetail || 0,
        hasSimpleQuantity:
          summary.totalItems - (quantityBreakdown?.itemsWithDetail || 0),
        avgRemainderPerItem:
          summary.totalItems > 0
            ? Math.round(
                ((quantityBreakdown?.totalRemainderItems || 0) /
                  summary.totalItems) *
                  100
              ) / 100
            : 0,
      },
    };
  }, [summary]);

  // ✅ Helper functions for display
  const getQuantityByType = (type: "ea" | "dsp" | "cs"): number => {
    return summary.quantityBreakdown?.[`total${type.toUpperCase()}`] || 0;
  };

  const getCategoryPercentage = (category: string): number => {
    const count = summary.categories[category] || 0;
    return summary.totalItems > 0
      ? Math.round((count / summary.totalItems) * 100)
      : 0;
  };

  const getBrandPercentage = (brand: string): number => {
    const count = summary.brands[brand] || 0;
    return summary.totalItems > 0
      ? Math.round((count / summary.brands) * 100)
      : 0;
  };

  // ✅ Generate summary text for display
  const getSummaryText = (): string => {
    const { totalItems, totalProducts, quantityBreakdown } = summary;
    const { detailCoverage } = computedStats;

    let text = `รวม ${totalItems} รายการ จาก ${totalProducts} สินค้า`;

    if (quantityBreakdown && quantityBreakdown.itemsWithDetail > 0) {
      text += ` (${detailCoverage}% มีรายละเอียดจำนวน)`;
    }

    return text;
  };

  // ✅ Generate detailed breakdown text
  const getDetailedBreakdown = (): string[] => {
    const breakdown: string[] = [];
    const { quantityBreakdown } = summary;

    if (!quantityBreakdown) return breakdown;

    if (quantityBreakdown.totalEA > 0) {
      breakdown.push(`${quantityBreakdown.totalEA} ชิ้น (EA)`);
    }

    if (quantityBreakdown.totalDSP > 0) {
      breakdown.push(`${quantityBreakdown.totalDSP} แพ็ค (DSP)`);
    }

    if (quantityBreakdown.totalCS > 0) {
      breakdown.push(`${quantityBreakdown.totalCS} ลัง (CS)`);
    }

    if (quantityBreakdown.totalRemainderItems > 0) {
      breakdown.push(`${quantityBreakdown.totalRemainderItems} ชิ้นเศษ`);
    }

    return breakdown;
  };

  // ✅ Filter helpers for different views
  const getItemsByType = (type: "ea" | "dsp" | "cs"): InventoryItem[] => {
    return inventory.filter(
      (item) =>
        item.quantityDetail?.scannedType === type ||
        (!item.quantityDetail && item.barcodeType === type)
    );
  };

  const getItemsWithDetails = (): InventoryItem[] => {
    return inventory.filter((item) => !!item.quantityDetail);
  };

  const getItemsWithoutDetails = (): InventoryItem[] => {
    return inventory.filter((item) => !item.quantityDetail);
  };

  return {
    // Core summary data
    summary,
    computedStats,

    // Helper functions
    getQuantityByType,
    getCategoryPercentage,
    getBrandPercentage,
    getSummaryText,
    getDetailedBreakdown,

    // Filter functions
    getItemsByType,
    getItemsWithDetails,
    getItemsWithoutDetails,
  };
};
