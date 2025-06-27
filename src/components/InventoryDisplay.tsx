// Path: src/components/InventoryDisplay.tsx
// Updated to use new table view with grouped inventory items

"use client";

import React, { useState, useMemo, useCallback } from "react";
import { List, Grid, Table } from "lucide-react";
import {
  InventoryItem,
  GroupedInventoryItem,
  InventorySummary,
  InventoryOperationResult,
  InventoryUtils,
} from "../hooks/inventory/types";
import { BarcodeType } from "../types/product";
import {
  InventoryHeader,
  InventoryControls,
  InventoryList, // Keep for legacy view
  ConfirmDeleteDialog,
  ErrorAlert,
  LoadingSpinner,
} from "./inventory";
import { InventoryTable } from "./inventory/InventoryTable"; // ✅ NEW: Table view

interface InventoryDisplayProps {
  inventory: InventoryItem[];
  groupedInventory: GroupedInventoryItem[]; // ✅ NEW: Grouped data
  summary: InventorySummary;
  isLoading: boolean;
  error: string | null;
  onUpdateQuantity: (
    baseProductId: string,
    barcodeType: BarcodeType,
    newQuantity: number
  ) => InventoryOperationResult; // ✅ UPDATED: New signature
  onRemoveItem: (itemId: string) => boolean; // Keep for individual items
  onRemoveProduct: (baseProductId: string) => InventoryOperationResult; // ✅ NEW: Remove entire product
  onClearInventory: () => boolean;
  onExportInventory: () => boolean;
  onClearError: () => void;
  onSearch: (searchTerm: string) => InventoryItem[];
  onSearchGrouped: (searchTerm: string) => GroupedInventoryItem[]; // ✅ NEW: Grouped search
}

// ✅ View mode enum
type ViewMode = "table" | "list" | "grid";
type SortBy = "name" | "quantity" | "date" | "materialCode";
type SortOrder = "asc" | "desc";

export const InventoryDisplay: React.FC<InventoryDisplayProps> = ({
  inventory,
  groupedInventory,
  summary,
  isLoading,
  error,
  onUpdateQuantity,
  onRemoveItem,
  onRemoveProduct,
  onClearInventory,
  onExportInventory,
  onClearError,
  onSearch,
  onSearchGrouped,
}) => {
  // ✅ State management
  const [viewMode, setViewMode] = useState<ViewMode>("table"); // Default to table view
  const [showSummary, setShowSummary] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortBy>("materialCode");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // ✅ Filter and sort grouped inventory
  const filteredAndSortedGroupedItems = useMemo(() => {
    let filtered = groupedInventory;

    // Apply search filter
    if (searchTerm) {
      filtered = onSearchGrouped(searchTerm);
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter((item) => {
        // Get category from one of the records
        const sampleRecord = item.csRecord || item.dspRecord || item.eaRecord;
        return sampleRecord?.category === selectedCategory;
      });
    }

    // Apply brand filter
    if (selectedBrand) {
      filtered = filtered.filter((item) => item.brand === selectedBrand);
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let valueA: string | number;
      let valueB: string | number;

      switch (sortBy) {
        case "name":
          valueA = a.baseName.toLowerCase();
          valueB = b.baseName.toLowerCase();
          break;
        case "quantity":
          valueA = a.csQuantity + a.dspQuantity + a.eaQuantity;
          valueB = b.csQuantity + b.dspQuantity + b.eaQuantity;
          break;
        case "date":
          valueA = new Date(a.lastUpdated).getTime();
          valueB = new Date(b.lastUpdated).getTime();
          break;
        case "materialCode":
        default:
          valueA = a.materialCode.toLowerCase();
          valueB = b.materialCode.toLowerCase();
          break;
      }

      if (valueA < valueB) return sortOrder === "asc" ? -1 : 1;
      if (valueA > valueB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [
    groupedInventory,
    onSearchGrouped,
    searchTerm,
    selectedCategory,
    selectedBrand,
    sortBy,
    sortOrder,
  ]);

  // ✅ Legacy filtered inventory for list/grid view
  const filteredAndSortedInventory = useMemo(() => {
    let filtered = inventory;

    if (searchTerm) {
      filtered = onSearch(searchTerm);
    }

    if (selectedCategory) {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    if (selectedBrand) {
      filtered = filtered.filter((item) => item.brand === selectedBrand);
    }

    // Sort inventory items
    const sorted = [...filtered].sort((a, b) => {
      let valueA: string | number;
      let valueB: string | number;

      switch (sortBy) {
        case "name":
          valueA = a.productName.toLowerCase();
          valueB = b.productName.toLowerCase();
          break;
        case "quantity":
          valueA = a.quantity;
          valueB = b.quantity;
          break;
        case "date":
          valueA = new Date(a.lastUpdated).getTime();
          valueB = new Date(b.lastUpdated).getTime();
          break;
        case "materialCode":
        default:
          valueA = (a.materialCode || "").toLowerCase();
          valueB = (b.materialCode || "").toLowerCase();
          break;
      }

      if (valueA < valueB) return sortOrder === "asc" ? -1 : 1;
      if (valueA > valueB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [
    inventory,
    onSearch,
    searchTerm,
    selectedCategory,
    selectedBrand,
    sortBy,
    sortOrder,
  ]);

  // ✅ Handlers
  const handleSortChange = useCallback(
    (newSortBy: SortBy) => {
      if (sortBy === newSortBy) {
        setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(newSortBy);
        setSortOrder("asc");
      }
    },
    [sortBy]
  );

  const handleClearFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedCategory("");
    setSelectedBrand("");
    setSortBy("materialCode");
    setSortOrder("asc");
  }, []);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const success = onExportInventory();
      if (!success) {
        console.error("Export failed");
      }
    } finally {
      setIsExporting(false);
    }
  }, [onExportInventory]);

  const handleConfirmClear = useCallback(() => {
    const success = onClearInventory();
    setShowConfirmClear(false);
    if (success) {
      console.log("✅ Inventory cleared successfully");
    }
  }, [onClearInventory]);

  // ✅ Loading state
  if (isLoading) {
    return <LoadingSpinner message="กำลังโหลดข้อมูล inventory..." size="lg" />;
  }

  return (
    <div className="space-y-4">
      {/* ✅ Error Display */}
      <ErrorAlert error={error} onDismiss={onClearError} />

      {/* ✅ Summary Header */}
      <InventoryHeader
        summary={summary}
        showSummary={showSummary}
        onToggleSummary={setShowSummary}
      />

      {/* ✅ Enhanced Controls with View Mode Toggle */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            การจัดการสินค้า
          </h2>

          {/* ✅ View Mode Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "table"
                  ? "bg-white text-fn-green shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              title="มุมมองตาราง"
            >
              <Table size={16} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "list"
                  ? "bg-white text-fn-green shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              title="มุมมองรายการ"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "grid"
                  ? "bg-white text-fn-green shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              title="มุมมองกริด"
            >
              <Grid size={16} />
            </button>
          </div>
        </div>

        {/* ✅ Search and Filter Controls */}
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
          filteredCount={
            viewMode === "table"
              ? filteredAndSortedGroupedItems.length
              : filteredAndSortedInventory.length
          }
        />
      </div>

      {/* ✅ Main Content - Switch between views */}
      {viewMode === "table" ? (
        /* ✅ NEW: Table View (Default) */
        <InventoryTable
          groupedItems={filteredAndSortedGroupedItems}
          totalProducts={groupedInventory.length}
          totalRecords={inventory.length}
          onUpdateQuantity={onUpdateQuantity}
          onRemoveProduct={onRemoveProduct}
          isLoading={isLoading}
        />
      ) : (
        /* ✅ Legacy List/Grid View */
        <InventoryList
          items={filteredAndSortedInventory}
          totalCount={inventory.length}
          editingItem={null} // Simplified for now
          editQuantity={0}
          onEditStart={() => {}} // Simplified
          onEditSave={() => {}}
          onEditCancel={() => {}}
          onEditQuantityChange={() => {}}
          onQuickAdjust={() => {}}
          onRemoveItem={(itemId) => onRemoveItem(itemId)}
        />
      )}

      {/* ✅ Confirm Clear All Dialog */}
      <ConfirmDeleteDialog
        isOpen={showConfirmClear}
        itemCount={inventory.length}
        onConfirm={handleConfirmClear}
        onCancel={() => setShowConfirmClear(false)}
      />

      {/* ✅ Development Debug Panel */}
      {process.env.NODE_ENV === "development" && (
        <div className="bg-gray-100 rounded-lg p-4 border border-gray-300">
          <details className="text-sm">
            <summary className="cursor-pointer font-medium mb-2">
              🔧 Debug Info
            </summary>
            <div className="space-y-2 font-mono text-xs">
              <div>View Mode: {viewMode}</div>
              <div>Total Records: {inventory.length}</div>
              <div>Grouped Products: {groupedInventory.length}</div>
              <div>
                Filtered (Table): {filteredAndSortedGroupedItems.length}
              </div>
              <div>Filtered (List): {filteredAndSortedInventory.length}</div>
              <div>Search Term: "{searchTerm}"</div>
              <div>
                Sort: {sortBy} {sortOrder}
              </div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
};
