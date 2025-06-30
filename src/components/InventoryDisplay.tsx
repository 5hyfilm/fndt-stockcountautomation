// Path: src/components/InventoryDisplay.tsx - Fixed ErrorAlert Props
"use client";

import React, { useState, useMemo } from "react";
import {
  InventoryItem,
  QuantityDetail,
  InventorySummary,
} from "../hooks/inventory/types";
import { Product } from "../types/product";
import {
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
  summary: InventorySummary;
  onAddOrUpdateItem: (
    product: Product,
    quantityInput: number,
    barcodeType?: "ea" | "dsp" | "cs"
  ) => boolean;
  onUpdateItemQuantity: (itemId: string, newQuantity: number) => boolean;
  onUpdateItemQuantityDetail?: (
    materialCode: string,
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

  // ✅ Sort states - default to F/FG code sorting
  const [sortBy, setSortBy] = useState<SortBy>("fgCode");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [isExporting, setIsExporting] = useState(false);

  // ✅ FIXED: Combined sort handler for InventoryControls
  const handleSortChange = (newSortBy: string, newSortOrder: string) => {
    console.log("🔧 handleSortChange:", { newSortBy, newSortOrder });
    setSortBy(newSortBy as SortBy);
    setSortOrder(newSortOrder as SortOrder);
  };

  // ✅ Clear filters handler
  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedBrand("all");
    setSelectedUnitType("all");
    setSortBy("fgCode");
    setSortOrder("asc");
  };

  // ✅ Helper function to find item by itemId
  const findItemById = (itemId: string): InventoryItem | undefined => {
    return inventory.find((item) => item.id === itemId);
  };

  // ✅ FIXED: Wrapper function to handle materialCode conversion
  const handleEditQuantityDetailSave = (
    materialCode: string,
    quantityDetail: QuantityDetail
  ): boolean => {
    console.log("🔧 handleEditQuantityDetailSave:", {
      materialCode,
      quantityDetail,
      functionExists: !!onUpdateItemQuantityDetail,
    });

    if (!onUpdateItemQuantityDetail) {
      console.error("❌ onUpdateItemQuantityDetail function not provided");
      return false;
    }

    // Call the actual function with materialCode
    const success = onUpdateItemQuantityDetail(materialCode, quantityDetail);

    if (success) {
      // Clear edit state
      setEditState({
        itemId: null,
        simpleQuantity: 0,
        quantityDetail: undefined,
      });
    }

    return success;
  };

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
          comparison = getFgCode(a).localeCompare(getFgCode(b));
          break;
        default:
          comparison = 0;
      }

      return sortOrder === "desc" ? -comparison : comparison;
    });

    return filtered;
  }, [
    inventory,
    searchTerm,
    selectedCategory,
    selectedBrand,
    selectedUnitType,
    sortBy,
    sortOrder,
    onSearch,
  ]);

  // ✅ Edit handlers
  const handleEditStart = (item: InventoryItem) => {
    console.log("✏️ Starting edit for item:", item.id, item.materialCode);

    const totalQuantity = item.quantities
      ? Object.values(item.quantities).reduce((sum, qty) => sum + (qty || 0), 0)
      : item.quantity || 0;

    setEditState({
      itemId: item.id,
      simpleQuantity: totalQuantity,
      quantityDetail: item.quantities
        ? {
            cs: item.quantities.cs || 0,
            dsp: item.quantities.dsp || 0,
            ea: item.quantities.ea || 0,
            isManualEdit: true,
            lastModified: new Date().toISOString(),
          }
        : undefined,
    });
  };

  const handleEditSave = () => {
    if (!editState.itemId) return;

    const item = findItemById(editState.itemId);
    if (!item) {
      console.error("❌ Item not found for saving:", editState.itemId);
      return;
    }

    console.log("💾 Saving edit for item:", {
      itemId: item.id,
      materialCode: item.materialCode,
      simpleQuantity: editState.simpleQuantity,
    });

    // For simple quantity updates (legacy items)
    const success = onUpdateItemQuantity(
      editState.itemId,
      editState.simpleQuantity
    );

    if (success) {
      setEditState({
        itemId: null,
        simpleQuantity: 0,
        quantityDetail: undefined,
      });
    }
  };

  const handleEditCancel = () => {
    setEditState({
      itemId: null,
      simpleQuantity: 0,
      quantityDetail: undefined,
    });
  };

  const handleEditQuantityChange = (quantity: number) => {
    setEditState((prev) => ({
      ...prev,
      simpleQuantity: quantity,
    }));
  };

  const handleEditQuantityDetailChange = (quantityDetail: QuantityDetail) => {
    setEditState((prev) => ({
      ...prev,
      quantityDetail,
    }));
  };

  const handleQuickAdjust = (
    itemId: string,
    currentQuantity: number,
    delta: number
  ) => {
    const newQuantity = Math.max(0, currentQuantity + delta);
    onUpdateItemQuantity(itemId, newQuantity);
  };

  // ✅ Individual delete handlers
  const handleRequestDeleteItem = (itemId: string) => {
    const item = findItemById(itemId);
    if (item) {
      setItemToDelete(item);
      setShowConfirmDeleteItem(true);
    }
  };

  const handleConfirmDeleteItem = () => {
    if (itemToDelete) {
      onRemoveItem(itemToDelete.id);
      setItemToDelete(null);
    }
    setShowConfirmDeleteItem(false);
  };

  const handleCancelDeleteItem = () => {
    setItemToDelete(null);
    setShowConfirmDeleteItem(false);
  };

  // ✅ Export handler
  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport();
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ✅ FIXED: Error Alert - ใช้ props ที่ถูกต้องตาม ErrorAlert interface */}
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
        selectedUnitType={selectedUnitType}
        onUnitTypeChange={setSelectedUnitType}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange} // ✅ FIXED: ใช้ combined handler
        onClearFilters={handleClearFilters} // ✅ FIXED: เพิ่ม clear filters handler
        onExport={handleExport}
        onClearAll={() => setShowConfirmClear(true)}
        isExporting={isExporting}
        filteredCount={filteredAndSortedInventory.length} // ✅ FIXED: ส่ง filtered count
      />

      {/* Inventory List */}
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
        onRemoveItem={handleRequestDeleteItem}
      />

      {/* Clear All Confirmation Modal */}
      <ConfirmDeleteDialog
        isOpen={showConfirmClear}
        onConfirm={() => {
          onClearInventory();
          setShowConfirmClear(false);
        }}
        onCancel={() => setShowConfirmClear(false)}
        title="ล้างข้อมูลทั้งหมด"
        message="คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลสินค้าทั้งหมด?"
        confirmText="ลบทั้งหมด"
        cancelText="ยกเลิก"
        type="danger"
        itemCount={inventory.length}
      />

      {/* Individual Delete Confirmation Modal */}
      <ConfirmDeleteDialog
        isOpen={showConfirmDeleteItem}
        onConfirm={handleConfirmDeleteItem}
        onCancel={handleCancelDeleteItem}
        title="ลบรายการสินค้า"
        message={`คุณแน่ใจหรือไม่ว่าต้องการลบ "${itemToDelete?.productName}" ออกจาก inventory?`}
        confirmText="ลบ"
        cancelText="ยกเลิก"
        type="warning"
      />
    </div>
  );
};
