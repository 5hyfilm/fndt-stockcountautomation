// src/components/InventoryDisplay.tsx - Enhanced Version with Detailed Quantity Support
"use client";

import React, { useState } from "react";
import {
  InventoryItem,
  InventorySummary,
  QuantityDetail,
} from "../hooks/inventory/types";
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
  onUpdateQuantityDetail?: (
    itemId: string,
    quantityDetail: QuantityDetail
  ) => boolean;
  onRemoveItem: (itemId: string) => boolean;
  onClearInventory: () => boolean;
  onExportInventory: () => boolean;
  onClearError: () => void;
  onSearch: (searchTerm: string) => InventoryItem[];
}

// ✅ Enhanced edit state for detailed quantity support
interface EditState {
  itemId: string | null;
  simpleQuantity: number;
  quantityDetail?: QuantityDetail;
}

export const InventoryDisplay: React.FC<InventoryDisplayProps> = ({
  inventory,
  summary,
  isLoading,
  error,
  onUpdateQuantity,
  onUpdateQuantityDetail,
  onRemoveItem,
  onClearInventory,
  onExportInventory,
  onClearError,
  onSearch,
}) => {
  // ✅ Enhanced state management
  const [searchTerm, setSearchTerm] = useState("");
  const [editState, setEditState] = useState<EditState>({
    itemId: null,
    simpleQuantity: 0,
    quantityDetail: undefined,
  });
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

  // ✅ Enhanced event handlers
  const handleEditStart = (item: InventoryItem) => {
    console.log("🎯 Starting edit for item:", {
      id: item.id,
      quantity: item.quantity,
      quantityDetail: item.quantityDetail,
      barcodeType: item.barcodeType,
    });

    setEditState({
      itemId: item.id,
      simpleQuantity: item.quantityDetail?.major || item.quantity,
      quantityDetail: item.quantityDetail,
    });
  };

  const handleEditSave = () => {
    if (!editState.itemId) return;

    console.log("💾 Saving edit state:", editState);

    // Find the item being edited
    const item = inventory.find((i) => i.id === editState.itemId);
    if (!item) return;

    const isDetailedUnit = item.barcodeType !== "ea";

    let success = false;

    if (isDetailedUnit && editState.quantityDetail && onUpdateQuantityDetail) {
      // Save detailed quantity for DSP/CS
      success = onUpdateQuantityDetail(
        editState.itemId,
        editState.quantityDetail
      );
      console.log("✅ Detailed quantity save result:", success);
    } else {
      // Save simple quantity for EA or fallback
      success = onUpdateQuantity(editState.itemId, editState.simpleQuantity);
      console.log("✅ Simple quantity save result:", success);
    }

    if (success) {
      setEditState({
        itemId: null,
        simpleQuantity: 0,
        quantityDetail: undefined,
      });
    }
  };

  // ✅ New handler for detailed quantity changes during editing
  const handleEditQuantityDetailChange = (quantityDetail: QuantityDetail) => {
    console.log("🔄 Updating quantity detail in edit state:", quantityDetail);

    setEditState((prev) => ({
      ...prev,
      quantityDetail,
      simpleQuantity: quantityDetail.major, // Keep simple quantity in sync
    }));
  };

  // ✅ Enhanced handler for quantity detail saves
  const handleEditQuantityDetailSave = (
    itemId: string,
    quantityDetail: QuantityDetail
  ): boolean => {
    console.log("💾 Direct save quantity detail:", { itemId, quantityDetail });

    if (onUpdateQuantityDetail) {
      const success = onUpdateQuantityDetail(itemId, quantityDetail);
      if (success) {
        // Update our edit state if this is the item being edited
        if (editState.itemId === itemId) {
          setEditState({
            itemId: null,
            simpleQuantity: 0,
            quantityDetail: undefined,
          });
        }
      }
      return success;
    }
    return false;
  };

  const handleEditCancel = () => {
    console.log("❌ Cancelling edit");
    setEditState({
      itemId: null,
      simpleQuantity: 0,
      quantityDetail: undefined,
    });
  };

  const handleEditQuantityChange = (quantity: number) => {
    console.log("🔄 Edit quantity change:", quantity);
    setEditState((prev) => ({
      ...prev,
      simpleQuantity: quantity,
    }));
  };

  const handleQuickAdjust = (
    itemId: string,
    currentQuantity: number,
    delta: number
  ) => {
    const newQuantity = Math.max(0, currentQuantity + delta);
    console.log("⚡ Quick adjust:", {
      itemId,
      currentQuantity,
      delta,
      newQuantity,
    });
    onUpdateQuantity(itemId, newQuantity);
  };

  const handleExport = async () => {
    if (inventory.length === 0) {
      return;
    }

    setIsExporting(true);
    try {
      const success = onExportInventory();
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

      {/* Summary Header */}
      <InventoryHeader
        summary={summary}
        showSummary={showSummary}
        onToggleSummary={setShowSummary}
      />

      {/* Controls */}
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

      {/* ✅ Enhanced Inventory List with detailed quantity support */}
      <InventoryList
        items={filteredAndSortedInventory}
        totalCount={inventory.length}
        editingItem={editState.itemId}
        editQuantity={editState.simpleQuantity}
        onEditStart={handleEditStart}
        onEditSave={handleEditSave}
        onEditQuantityDetailSave={handleEditQuantityDetailSave}
        onEditCancel={handleEditCancel}
        onEditQuantityChange={handleEditQuantityChange}
        onEditQuantityDetailChange={handleEditQuantityDetailChange} // ✅ New callback
        onQuickAdjust={handleQuickAdjust}
        onRemoveItem={onRemoveItem}
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
