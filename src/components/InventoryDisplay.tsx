// Path: src/components/InventoryDisplay.tsx - Added Individual Delete Confirmation Modal
"use client";

import React, { useState, useMemo, useCallback } from "react";
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
// ✅ Import the new individual delete confirmation modal
import { ConfirmDeleteItemDialog } from "./inventory/ConfirmDeleteItemDialog";

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

// ✅ Updated SortBy type to include fgCode
type SortBy = "name" | "quantity" | "date" | "fgCode";
type SortOrder = "asc" | "desc";

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
  // ✅ Helper function to determine if item is a new product
  const isNewProduct = useCallback((item: InventoryItem): boolean => {
    return (
      item.materialCode?.startsWith("new_") ||
      item.brand === "เพิ่มใหม่" ||
      item.id?.startsWith("new_") ||
      !item.materialCode ||
      item.materialCode === ""
    );
  }, []);

  // ✅ Helper function to get F/FG code for sorting
  const getFgCode = useCallback(
    (item: InventoryItem): string => {
      if (isNewProduct(item)) {
        return item.productName || "NEW";
      }
      return item.materialCode || item.barcode || "";
    },
    [isNewProduct]
  );

  // ✅ Enhanced state management - Changed default to fgCode sorting
  const [searchTerm, setSearchTerm] = useState("");
  const [editState, setEditState] = useState<EditState>({
    itemId: null,
    simpleQuantity: 0,
    quantityDetail: undefined,
  });

  // ✅ State for clear all confirmation modal (existing)
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // ✅ NEW: State for individual delete confirmation modal
  const [showConfirmDeleteItem, setShowConfirmDeleteItem] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [showSummary, setShowSummary] = useState(false);
  // ✅ Changed default sorting from "date" to "fgCode"
  const [sortBy, setSortBy] = useState<SortBy>("fgCode");
  // ✅ Changed default order from "desc" to "asc" for alphabetical sorting
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [isExporting, setIsExporting] = useState(false);

  // ✅ Enhanced filtered and sorted inventory with F/FG code sorting
  const filteredAndSortedInventory = useMemo(() => {
    let filtered = [...inventory];

    // Apply search filter
    if (searchTerm.trim()) {
      const searchResults = onSearch(searchTerm.trim());
      filtered = searchResults;
    }

    // Apply category filter - Fixed field name
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (item) =>
          item.category === selectedCategory ||
          item.productGroup === selectedCategory
      );
    }

    // Apply brand filter
    if (selectedBrand !== "all") {
      filtered = filtered.filter((item) => item.brand === selectedBrand);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.productName.localeCompare(b.productName, "th");
          break;
        case "quantity":
          // ✅ Enhanced quantity comparison supporting quantityDetail
          const aQty = a.quantityDetail?.major ?? a.quantity;
          const bQty = b.quantityDetail?.major ?? b.quantity;
          comparison = aQty - bQty;
          break;
        case "date":
          comparison =
            new Date(a.lastUpdated).getTime() -
            new Date(b.lastUpdated).getTime();
          break;
        // ✅ New case for F/FG code sorting
        case "fgCode":
          const aFgCode = getFgCode(a);
          const bFgCode = getFgCode(b);
          comparison = aFgCode.localeCompare(bFgCode, "th", {
            numeric: true, // Handle mixed alphanumeric codes like ABC001, ABC002
            sensitivity: "base", // Case insensitive
          });
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
    getFgCode, // ✅ Added dependency
  ]);

  // ✅ Enhanced event handlers
  const handleEditStart = useCallback((item: InventoryItem) => {
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
  }, []);

  // ✅ Fixed edit save handler
  const handleEditSave = useCallback(() => {
    if (!editState.itemId) {
      console.warn("⚠️ No item ID in edit state");
      return;
    }

    console.log("💾 Saving edit state:", editState);

    // Find the item being edited
    const item = inventory.find((i) => i.id === editState.itemId);
    if (!item) {
      console.error("❌ Item not found:", editState.itemId);
      return;
    }

    const isDetailedUnit = item.barcodeType !== "ea";

    let success = false;

    try {
      if (
        isDetailedUnit &&
        editState.quantityDetail &&
        onUpdateQuantityDetail
      ) {
        // Save detailed quantity for DSP/CS
        console.log(
          "💾 Saving as detailed quantity:",
          editState.quantityDetail
        );
        success = onUpdateQuantityDetail(
          editState.itemId,
          editState.quantityDetail
        );
        console.log("✅ Detailed quantity save result:", success);
      } else {
        // Save simple quantity for EA or fallback
        console.log("💾 Saving as simple quantity:", editState.simpleQuantity);
        success = onUpdateQuantity(editState.itemId, editState.simpleQuantity);
        console.log("✅ Simple quantity save result:", success);
      }

      if (success) {
        // ✅ Reset edit state after successful save
        setEditState({
          itemId: null,
          simpleQuantity: 0,
          quantityDetail: undefined,
        });
      } else {
        console.error("❌ Save operation failed");
      }
    } catch (error) {
      console.error("❌ Error during save:", error);
    }
  }, [editState, inventory, onUpdateQuantity, onUpdateQuantityDetail]);

  // ✅ Enhanced handler for detailed quantity changes during editing
  const handleEditQuantityDetailChange = useCallback(
    (quantityDetail: QuantityDetail) => {
      console.log("🔄 Updating quantity detail in edit state:", quantityDetail);

      setEditState((prev) => ({
        ...prev,
        quantityDetail,
        simpleQuantity: quantityDetail.major, // Keep simple quantity in sync
      }));
    },
    []
  );

  // ✅ Fixed handler for direct quantity detail saves (from InventoryListItem)
  const handleEditQuantityDetailSave = useCallback(
    (itemId: string, quantityDetail: QuantityDetail): boolean => {
      console.log("💾 Direct save quantity detail:", {
        itemId,
        quantityDetail,
      });

      try {
        if (onUpdateQuantityDetail) {
          const success = onUpdateQuantityDetail(itemId, quantityDetail);

          if (success) {
            console.log("✅ Direct detailed quantity save successful");

            // ✅ Reset edit state only if this is the item being edited
            if (editState.itemId === itemId) {
              setEditState({
                itemId: null,
                simpleQuantity: 0,
                quantityDetail: undefined,
              });
            }

            return true;
          } else {
            console.error("❌ Direct detailed quantity save failed");
            return false;
          }
        } else {
          console.warn("⚠️ onUpdateQuantityDetail callback not available");
          return false;
        }
      } catch (error) {
        console.error("❌ Error during direct detailed quantity save:", error);
        return false;
      }
    },
    [editState.itemId, onUpdateQuantityDetail]
  );

  const handleEditCancel = useCallback(() => {
    console.log("❌ Cancelling edit");
    setEditState({
      itemId: null,
      simpleQuantity: 0,
      quantityDetail: undefined,
    });
  }, []);

  // ✅ Fixed edit quantity change handler
  const handleEditQuantityChange = useCallback((quantity: number) => {
    console.log("🔄 Edit quantity change:", quantity);
    setEditState((prev) => ({
      ...prev,
      simpleQuantity: quantity,
      // ✅ Also update quantityDetail.major if it exists
      quantityDetail: prev.quantityDetail
        ? { ...prev.quantityDetail, major: quantity }
        : undefined,
    }));
  }, []);

  const handleQuickAdjust = useCallback(
    (itemId: string, currentQuantity: number, delta: number) => {
      const newQuantity = Math.max(0, currentQuantity + delta);
      console.log("⚡ Quick adjust:", {
        itemId,
        currentQuantity,
        delta,
        newQuantity,
      });

      const success = onUpdateQuantity(itemId, newQuantity);
      if (success) {
        console.log(
          `✅ Quick adjusted ${itemId}: ${currentQuantity} -> ${newQuantity}`
        );
      }
    },
    [onUpdateQuantity]
  );

  const handleExport = useCallback(async () => {
    if (inventory.length === 0) {
      return;
    }

    setIsExporting(true);
    try {
      const success = onExportInventory();
      if (success) {
        console.log("✅ Export successful");
        // Show success message briefly
        setTimeout(() => {
          setIsExporting(false);
        }, 2000);
      } else {
        setIsExporting(false);
      }
    } catch (error) {
      console.error("❌ Export failed:", error);
      setIsExporting(false);
    }
  }, [onExportInventory, inventory.length]);

  const handleClearFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedBrand("all");
  }, []);

  // ✅ Fixed sort change handler with proper typing
  const handleSortChange = useCallback(
    (newSortBy: string, newSortOrder: string) => {
      const validSortBy = newSortBy as SortBy;
      const validSortOrder = newSortOrder as SortOrder;

      console.log("🔄 Sort change:", {
        sortBy: validSortBy,
        sortOrder: validSortOrder,
      });

      setSortBy(validSortBy);
      setSortOrder(validSortOrder);
    },
    []
  );

  // ✅ Handler for clear all confirmation (existing)
  const handleConfirmClear = useCallback(() => {
    const success = onClearInventory();
    if (success) {
      setShowConfirmClear(false);
      // Also reset edit state
      setEditState({
        itemId: null,
        simpleQuantity: 0,
        quantityDetail: undefined,
      });
    }
  }, [onClearInventory]);

  // ✅ NEW: Handlers for individual delete confirmation
  const handleShowDeleteConfirmation = useCallback(
    (itemId: string) => {
      console.log("🗑️ Showing delete confirmation for item:", itemId);

      // Find the item to delete
      const item = inventory.find((i) => i.id === itemId);
      if (item) {
        setItemToDelete(item);
        setShowConfirmDeleteItem(true);
      } else {
        console.error("❌ Item not found for deletion:", itemId);
      }
    },
    [inventory]
  );

  const handleCancelDeleteItem = useCallback(() => {
    console.log("❌ Cancelling item deletion");
    setShowConfirmDeleteItem(false);
    setItemToDelete(null);
  }, []);

  const handleConfirmDeleteItem = useCallback(
    (itemId: string) => {
      console.log("🗑️ Confirming item deletion:", itemId);

      try {
        const success = onRemoveItem(itemId);
        if (success) {
          console.log("✅ Item deleted successfully:", itemId);

          // Close modal and reset state
          setShowConfirmDeleteItem(false);
          setItemToDelete(null);

          // Reset edit state if we're deleting the item being edited
          if (editState.itemId === itemId) {
            setEditState({
              itemId: null,
              simpleQuantity: 0,
              quantityDetail: undefined,
            });
          }
        } else {
          console.error("❌ Failed to delete item:", itemId);
          // Keep modal open so user can try again
        }
      } catch (error) {
        console.error("❌ Error during item deletion:", error);
        // Keep modal open so user can try again
      }
    },
    [onRemoveItem, editState.itemId]
  );

  // ✅ Enhanced loading and error states
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

      {/* ✅ Enhanced Inventory List with updated remove handler */}
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
        onEditQuantityDetailChange={handleEditQuantityDetailChange}
        onQuickAdjust={handleQuickAdjust}
        onRemoveItem={handleShowDeleteConfirmation} // ✅ Changed to show confirmation instead of direct removal
      />

      {/* Confirm Clear All Dialog (existing) */}
      <ConfirmDeleteDialog
        isOpen={showConfirmClear}
        itemCount={inventory.length}
        onConfirm={handleConfirmClear}
        onCancel={() => setShowConfirmClear(false)}
      />

      {/* ✅ NEW: Confirm Delete Individual Item Dialog */}
      <ConfirmDeleteItemDialog
        isOpen={showConfirmDeleteItem}
        item={itemToDelete}
        onConfirm={handleConfirmDeleteItem}
        onCancel={handleCancelDeleteItem}
      />
    </div>
  );
};
