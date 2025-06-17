// src/hooks/inventory/useInventorySummary.tsx - Updated with Dual Unit Support

"use client";

import { useMemo } from "react";
import { InventoryItem, InventorySummary } from "./types";

export const useInventorySummary = (
  inventory: InventoryItem[]
): InventorySummary => {
  return useMemo(() => {
    if (inventory.length === 0) {
      return {
        totalItems: 0,
        totalProducts: 0,
        lastUpdate: new Date().toISOString(),
        categories: {},
        brands: {},
        // ✅ Dual Unit Summary Fields
        totalCSUnits: 0,
        totalDSPUnits: 0,
        totalPieces: 0,
      };
    }

    // Basic counts
    const totalItems = inventory.length;
    const uniqueProducts = new Set(inventory.map((item) => item.barcode));
    const totalProducts = uniqueProducts.size;

    // Find latest update
    const lastUpdate = inventory.reduce((latest, item) => {
      const itemDate = new Date(item.lastUpdated);
      const latestDate = new Date(latest);
      return itemDate > latestDate ? item.lastUpdated : latest;
    }, inventory[0]?.lastUpdated || new Date().toISOString());

    // Category breakdown
    const categories = inventory.reduce((acc, item) => {
      const category = item.category || "ไม่ระบุ";
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Brand breakdown
    const brands = inventory.reduce((acc, item) => {
      const brand = item.brand || "ไม่ระบุ";
      acc[brand] = (acc[brand] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // ✅ Dual Unit Calculations
    const dualUnitSummary = inventory.reduce(
      (acc, item) => {
        // Count CS units (includes both CS and DSP in cs column)
        const csCount = item.csCount || 0;
        acc.totalCSUnits += csCount;

        // Count DSP units specifically
        if (item.csUnitType === "dsp") {
          acc.totalDSPUnits += csCount;
        }

        // Count pieces (includes DSP, EA, and fractional in piece column)
        const pieceCount = item.pieceCount || 0;
        acc.totalPieces += pieceCount;

        return acc;
      },
      {
        totalCSUnits: 0,
        totalDSPUnits: 0,
        totalPieces: 0,
      }
    );

    // Log summary for debugging
    console.log("📊 Inventory Summary Calculated:", {
      totalItems,
      totalProducts,
      totalCSUnits: dualUnitSummary.totalCSUnits,
      totalDSPUnits: dualUnitSummary.totalDSPUnits,
      totalPieces: dualUnitSummary.totalPieces,
      categories: Object.keys(categories).length,
      brands: Object.keys(brands).length,
    });

    return {
      totalItems,
      totalProducts,
      lastUpdate,
      categories,
      brands,
      // ✅ Include dual unit totals
      totalCSUnits: dualUnitSummary.totalCSUnits,
      totalDSPUnits: dualUnitSummary.totalDSPUnits,
      totalPieces: dualUnitSummary.totalPieces,
    };
  }, [inventory]);
};
