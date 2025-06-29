// Path: src/components/InventoryDisplay.tsx - Updated with Unit Type Filter Support
"use client";

import React, { useState, useMemo } from "react";
import { InventoryItem, QuantityDetail } from "../hooks/inventory/types";
import {
  InventoryHeader,
  InventoryControls,
  InventoryList,
  ConfirmDeleteDialog,
  ErrorAlert,
  LoadingSpinner,
} from "./inventory";
import {
  UnitFilterType,
  filterInventoryByUnitType,
} from "./inventory/UnitTypeFilter";

interface InventoryDisplayProps {
  inventory: InventoryItem[];
  isLoading: boolean;
  error: string | null;
  summary: any;
  onAddOrUpdateItem: (
    product: any,
    quantityInput: number,
    barcodeType?: "ea" | "dsp" | "cs"
  ) => boolean;
  onUpdateItemQuantity: (itemId: string, newQuantity: number) => boolean;
  onUpdateItemQuantityDetail?: (
    itemId: string,
    quantityDetail: QuantityDetail
  ) => boolean;
  onRemoveItem: (itemId: string) => boolean;
  onClearInventory: () => boolean;
  onSearch: (searchTerm: string) => InventoryItem[];
  onExport: () => Promise<void>;
  onClearError: () => void;
  className?: string;
}

type SortBy = "name" | "quantity" | "date" | "fgCode";
type SortOrder = "asc" | "desc";

interface EditState {
  itemId: string | null;
  simpleQuantity: number;
  quantityDetail?: QuantityDetail;
}

// ✅ Helper function to extract F/FG code for sorting
const getFgCode = (item: InventoryItem): string => {
  // Try materialCode first, then barcode, then fallback
  const code = item.materialCode || item.barcode || item.id;
  return code.toString().toUpperCase();
};

export const InventoryDisplay: React.FC<InventoryDisplayProps> = ({
  inventory,
  isLoading,
  error,
  summary,
  onUpdateItemQuantity,
  onUpdateItemQuantityDetail,
  onRemoveItem,
  onClearInventory,
  onSearch,
  onExport,
  onClearError,
  className = "",
}) => {
  // ✅ State management
  const [searchTerm, setSearchTerm] = useState("");
  const [editState, setEditState] = useState<EditState>({
    itemId: null,
    simpleQuantity: 0,
    quantityDetail: undefined,
  });

  // ✅ State for clear all confirmation modal
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // ✅ NEW: State for individual delete confirmation modal
  const [showConfirmDeleteItem, setShowConfirmDeleteItem] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

  // ✅ Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [selectedUnitType, setSelectedUnitType] =
    useState<UnitFilterType>("all");
  const [showSummary, setShowSummary] = useState(false);

  // ✅ Sort states - default to F/FG code sorting
  const [sortBy, setSortBy] = useState<SortBy>("fgCode");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [isExporting, setIsExporting] = useState(false);

  // ✅ Enhanced filtered and sorted inventory with Unit Type filter
  const filteredAndSortedInventory = useMemo(() => {
    let filtered = [...inventory];

    // Apply search filter
    if (searchTerm.trim()) {
      const searchResults = onSearch(searchTerm.trim());
      filtered = searchResults;
    }

    // Apply category filter
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

    // ✅ NEW: Apply unit type filter
    filtered = filterInventoryByUnitType(filtered, selectedUnitType);

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.productName.localeCompare(b.productName, "th");
          break;
        case "quantity":
          // ✅ Enhanced quantity comparison supporting multi-unit
          const aQty = a.quantities
            ? Object.values(a.quantities).reduce(
                (sum, qty) => sum + (qty || 0),
                0
              )
            : a.quantity || 0;
          const bQty = b.quantities
            ? Object.values(b.quantities).reduce(
                (sum, qty) => sum + (qty || 0),
                0
              )
            : b.quantity || 0;
          comparison = aQty - bQty;
          break;
        case "date":
          comparison =
            new Date(a.lastUpdated).getTime() -
            new Date(b.lastUpdated).getTime();
          break;
        case "fgCode":
          const aFgCode = getFgCode(a);
          const bFgCode = getFgCode(b);
          comparison = aFgCode.localeCompare(bFgCode, "th", {
            numeric: true,
            sensitivity: "base",
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
    selectedUnitType, // ✅ NEW dependency
    sortBy,
    sortOrder,
    onSearch,
  ]);

  // ✅ Event handlers
  const handleEditStart = (item: InventoryItem) => {
    setEditState({
      itemId: item.id,
      simpleQuantity: item.quantity,
      quantityDetail: item.quantityDetail,
    });
  };

  const handleEditSave = () => {
    if (!editState.itemId) return;

    let success = false;

    if (editState.quantityDetail && onUpdateItemQuantityDetail) {
      success = onUpdateItemQuantityDetail(
        editState.itemId,
        editState.quantityDetail
      );
    } else {
      success = onUpdateItemQuantity(
        editState.itemId,
        editState.simpleQuantity
      );
    }

    if (success) {
      setEditState({ itemId: null, simpleQuantity: 0 });
    }
  };

  const handleEditCancel = () => {
    setEditState({ itemId: null, simpleQuantity: 0 });
  };

  const handleQuickAdjust = (
    itemId: string,
    currentQuantity: number,
    delta: number
  ) => {
    const newQuantity = Math.max(0, currentQuantity + delta);
    onUpdateItemQuantity(itemId, newQuantity);
  };

  // ✅ UPDATED: Individual item delete with confirmation
  const handleRemoveItem = (itemId: string) => {
    const item = inventory.find((i) => i.id === itemId);
    if (item) {
      setItemToDelete(item);
      setShowConfirmDeleteItem(true);
    }
  };

  const confirmDeleteItem = () => {
    if (itemToDelete) {
      onRemoveItem(itemToDelete.id);
      setItemToDelete(null);
      setShowConfirmDeleteItem(false);
    }
  };

  const cancelDeleteItem = () => {
    setItemToDelete(null);
    setShowConfirmDeleteItem(false);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedBrand("all");
    setSelectedUnitType("all"); // ✅ NEW: Clear unit type filter
  };

  const handleSortChange = (newSortBy: string, newSortOrder: string) => {
    setSortBy(newSortBy as SortBy);
    setSortOrder(newSortOrder as SortOrder);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport();
    } finally {
      setIsExporting(false);
    }
  };

  // ✅ Component wrapper
  const containerClasses = `space-y-6 ${className}`.trim();

  if (isLoading) {
    return (
      <div className={containerClasses}>
        <LoadingSpinner message="กำลังโหลดข้อมูล inventory..." />
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      {/* Error Alert */}
      {error && <ErrorAlert message={error} onDismiss={onClearError} />}

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
        selectedUnitType={selectedUnitType} // ✅ NEW
        onUnitTypeChange={setSelectedUnitType} // ✅ NEW
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        onClearFilters={handleClearFilters}
        onExport={handleExport}
        onClearAll={() => setShowConfirmClear(true)}
        isExporting={isExporting}
        filteredCount={filteredAndSortedInventory.length}
      />

      {/* Inventory List */}
      <InventoryList
        items={filteredAndSortedInventory}
        totalCount={inventory.length}
        editingItem={editState.itemId}
        editQuantity={editState.simpleQuantity}
        onEditStart={handleEditStart}
        onEditSave={handleEditSave}
        onEditQuantityDetailSave={onUpdateItemQuantityDetail}
        onEditCancel={handleEditCancel}
        onEditQuantityChange={(quantity) =>
          setEditState((prev) => ({ ...prev, simpleQuantity: quantity }))
        }
        onEditQuantityDetailChange={(quantityDetail) =>
          setEditState((prev) => ({ ...prev, quantityDetail }))
        }
        onQuickAdjust={handleQuickAdjust}
        onRemoveItem={handleRemoveItem} // ✅ UPDATED: Now triggers confirmation
      />

      {/* Confirmation Modals */}
      <ConfirmDeleteDialog
        isOpen={showConfirmClear}
        onConfirm={() => {
          onClearInventory();
          setShowConfirmClear(false);
        }}
        onCancel={() => setShowConfirmClear(false)}
        title="ล้างข้อมูล Inventory ทั้งหมด"
        message="คุณแน่ใจหรือไม่ที่จะลบรายการสินค้าทั้งหมด? การดำเนินการนี้ไม่สามารถยกเลิกได้"
        confirmText="ล้างทั้งหมด"
        cancelText="ยกเลิก"
        type="danger"
      />

      {/* ✅ NEW: Individual Item Delete Confirmation */}
      <ConfirmDeleteDialog
        isOpen={showConfirmDeleteItem}
        onConfirm={confirmDeleteItem}
        onCancel={cancelDeleteItem}
        title="ลบรายการสินค้า"
        message={
          itemToDelete
            ? `คุณแน่ใจหรือไม่ที่จะลบ "${itemToDelete.productName}" ออกจากรายการ?`
            : ""
        }
        confirmText="ลบรายการ"
        cancelText="ยกเลิก"
        type="danger"
      />
    </div>
  );
};
