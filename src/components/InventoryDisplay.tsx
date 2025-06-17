// src/components/InventoryDisplay.tsx - Updated with Dual Unit Support
"use client";

import React, { useState } from "react";
import { InventoryItem, InventorySummary } from "../hooks/useInventoryManager";
import {
  InventoryHeader,
  InventoryControls,
  InventoryList,
  ConfirmDeleteDialog,
  ErrorAlert,
  LoadingSpinner,
} from "./inventory";

interface InventoryDisplayProps {
  inventory: InventoryItem[];
  summary: InventorySummary;
  isLoading: boolean;
  error: string | null;
  onUpdateQuantity: (itemId: string, newQuantity: number) => boolean;
  onUpdateDualUnit?: (
    itemId: string,
    newCSCount: number,
    newPieceCount: number
  ) => boolean; // ✅ NEW
  onRemoveItem: (itemId: string) => boolean;
  onClearInventory: () => boolean;
  onExportInventory?: () => boolean; // Legacy
  onExportInventoryWithDualUnits?: () => boolean; // ✅ NEW - Dual Unit Export
  onClearError: () => void;
  onSearch: (searchTerm: string) => InventoryItem[];
}

export const InventoryDisplay: React.FC<InventoryDisplayProps> = ({
  inventory,
  summary,
  isLoading,
  error,
  onUpdateQuantity,
  onUpdateDualUnit, // ✅ NEW
  onRemoveItem,
  onClearInventory,
  onExportInventory, // Legacy
  onExportInventoryWithDualUnits, // ✅ NEW
  onClearError,
  onSearch,
}) => {
  // State สำหรับ UI
  const [searchTerm, setSearchTerm] = useState("");
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(0);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [showSummary, setShowSummary] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "quantity" | "date">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isExporting, setIsExporting] = useState(false);

  // Filter และ sort inventory
  const filteredAndSortedInventory = React.useMemo(() => {
    let filtered = inventory;

    // Filter by search term
    if (searchTerm) {
      filtered = onSearch(searchTerm);
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    // Filter by brand
    if (selectedBrand !== "all") {
      filtered = filtered.filter((item) => item.brand === selectedBrand);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.productName.localeCompare(b.productName);
          break;
        case "quantity":
          comparison = a.quantity - b.quantity;
          break;
        case "date":
          comparison =
            new Date(a.lastUpdated).getTime() -
            new Date(b.lastUpdated).getTime();
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [
    inventory,
    searchTerm,
    selectedCategory,
    selectedBrand,
    sortBy,
    sortOrder,
    onSearch,
  ]);

  // Event handlers
  const handleEditStart = (item: InventoryItem) => {
    setEditingItem(item.id);
    setEditQuantity(item.quantity);
  };

  const handleEditSave = (itemId: string) => {
    const success = onUpdateQuantity(itemId, editQuantity);
    if (success) {
      setEditingItem(null);
    }
  };

  const handleEditCancel = () => {
    setEditingItem(null);
    setEditQuantity(0);
  };

  const handleQuickAdjust = (
    itemId: string,
    currentQuantity: number,
    delta: number
  ) => {
    const newQuantity = Math.max(0, currentQuantity + delta);
    onUpdateQuantity(itemId, newQuantity);
  };

  // ✅ Updated: Use Dual Unit Export by default
  const handleExport = async () => {
    if (inventory.length === 0) {
      return;
    }

    setIsExporting(true);
    try {
      // ✅ Prioritize dual unit export if available
      const exportFunction =
        onExportInventoryWithDualUnits || onExportInventory;

      if (!exportFunction) {
        console.error("No export function available");
        setIsExporting(false);
        return;
      }

      const success = exportFunction();
      if (success) {
        // Show success message briefly
        setTimeout(() => {
          setIsExporting(false);
        }, 2000);
      } else {
        setIsExporting(false);
      }
    } catch (error) {
      console.error("Export error:", error);
      setIsExporting(false);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedBrand("all");
  };

  const handleSortChange = (sort: string, order: string) => {
    setSortBy(sort as "name" | "quantity" | "date");
    setSortOrder(order as "asc" | "desc");
  };

  const handleConfirmClear = () => {
    onClearInventory();
    setShowConfirmClear(false);
  };

  // Loading state
  if (isLoading) {
    return <LoadingSpinner message="กำลังโหลดข้อมูล inventory..." size="lg" />;
  }

  return (
    <div className="space-y-4">
      {/* Error Display */}
      <ErrorAlert error={error} onDismiss={onClearError} />

      {/* ✅ Updated Summary Header - Dual Unit Support */}
      <InventoryHeader
        summary={summary}
        showSummary={showSummary}
        onToggleSummary={setShowSummary}
      />

      {/* ✅ Updated Controls - Dual Unit Support */}
      <InventoryControls
        inventory={inventory}
        summary={summary}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedBrand={selectedBrand}
        onBrandChange={setSelectedBrand}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        onClearFilters={handleClearFilters}
        onExport={handleExport}
        onClearAll={() => setShowConfirmClear(true)}
        isExporting={isExporting}
        filteredCount={filteredAndSortedInventory.length}
      />

      {/* ✅ Updated Inventory List - Dual Unit Support */}
      <InventoryList
        items={filteredAndSortedInventory}
        totalCount={inventory.length}
        editingItem={editingItem}
        editQuantity={editQuantity}
        onEditStart={handleEditStart}
        onEditSave={handleEditSave}
        onEditCancel={handleEditCancel}
        onEditQuantityChange={setEditQuantity}
        onQuickAdjust={handleQuickAdjust}
        onRemoveItem={onRemoveItem}
        onUpdateDualUnit={onUpdateDualUnit} // ✅ Pass dual unit handler
      />

      {/* Confirm Clear Dialog */}
      <ConfirmDeleteDialog
        isOpen={showConfirmClear}
        itemCount={inventory.length}
        onConfirm={handleConfirmClear}
        onCancel={() => setShowConfirmClear(false)}
      />
    </div>
  );
};
