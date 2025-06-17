// src/components/inventory/InventoryControls.tsx - Updated with Dual Unit Export
"use client";

import React from "react";
import {
  Search,
  Filter,
  X,
  FileText,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Package2,
  Box,
  ShoppingCart,
} from "lucide-react";
import {
  InventoryItem,
  InventorySummary,
} from "../../hooks/useInventoryManager";

interface InventoryControlsProps {
  inventory: InventoryItem[];
  summary: InventorySummary;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedBrand: string;
  onBrandChange: (brand: string) => void;
  sortBy: "name" | "quantity" | "date";
  sortOrder: "asc" | "desc";
  onSortChange: (sortBy: string, sortOrder: string) => void;
  onClearFilters: () => void;
  onExport: () => Promise<void>;
  onClearAll: () => void;
  isExporting: boolean;
  filteredCount: number;
}

export const InventoryControls: React.FC<InventoryControlsProps> = ({
  inventory,
  summary,
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedBrand,
  onBrandChange,
  sortBy,
  sortOrder,
  onSortChange,
  onClearFilters,
  onExport,
  onClearAll,
  isExporting,
  filteredCount,
}) => {
  // Get unique categories and brands for filters
  const categories = React.useMemo(
    () => [...new Set(inventory.map((item) => item.category))].sort(),
    [inventory]
  );

  const brands = React.useMemo(
    () => [...new Set(inventory.map((item) => item.brand))].sort(),
    [inventory]
  );

  const hasActiveFilters =
    searchTerm || selectedCategory !== "all" || selectedBrand !== "all";

  // State สำหรับการแสดง/ซ่อน filters dropdown
  const [showFilters, setShowFilters] = React.useState(false);

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-6">
      {/* Search and Actions */}
      <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
        <div className="flex-1 max-w-lg w-full">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="ค้นหาสินค้า..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:ring-2 focus:ring-fn-green/20 focus:border-fn-green transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 w-full xl:w-auto">
          {/* ✅ Updated Export Button - Dual Unit */}
          <button
            onClick={onExport}
            disabled={inventory.length === 0 || isExporting}
            className="flex items-center gap-2 px-4 py-3 bg-fn-green text-white rounded-lg font-medium hover:bg-fn-green/90 transition-all duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed flex-1 xl:flex-none justify-center"
          >
            <FileText size={18} />
            {isExporting ? "กำลังส่งออก..." : "ส่งออกเป็นไฟล์ CSV"}
          </button>

          <button
            onClick={onClearAll}
            disabled={inventory.length === 0}
            className="flex items-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Trash2 size={18} />
            ลบทั้งหมด
          </button>
        </div>
      </div>

      {/* ✅ Updated Export Preview - Dual Unit Format */}
      {inventory.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FileText className="text-green-600 mt-0.5" size={20} />
            <div className="flex-1">
              <div className="text-sm font-medium text-green-800 mb-1">
                ข้อมูลที่จะส่งออก:
              </div>
              <div className="text-sm text-green-700 flex items-center gap-4">
                <span>{summary.totalProducts} รายการสินค้า</span>
                <span>•</span>
                <span>{summary.totalCSUnits || 0} ลัง</span>
                <span>•</span>
                <span>{summary.totalDSPUnits || 0} แพ็ค</span>
                <span>•</span>
                <span>{summary.totalPieces || 0} ชิ้น</span>
              </div>
              <div className="text-xs text-green-600 mt-2">
                รูปแบบ CSV แยกหน่วย (Dual Unit)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Controls */}
      <div className="space-y-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-fn-green transition-colors"
        >
          <Filter size={16} />
          ตัวกรอง
          {hasActiveFilters && (
            <span className="bg-fn-orange text-white text-xs px-2 py-1 rounded-full">
              {
                [
                  searchTerm && "ค้นหา",
                  selectedCategory !== "all" && "หมวดหมู่",
                  selectedBrand !== "all" && "แบรนด์",
                ].filter(Boolean).length
              }
            </span>
          )}
          {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                หมวดหมู่:
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => onCategoryChange(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-fn-green/20 focus:border-fn-green"
              >
                <option value="all">ทั้งหมด</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                แบรนด์:
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => onBrandChange(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-fn-green/20 focus:border-fn-green"
              >
                <option value="all">ทั้งหมด</option>
                {brands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Options */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                เรียงตาม:
              </label>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => onSortChange(e.target.value, sortOrder)}
                  className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-fn-green/20 focus:border-fn-green"
                >
                  <option value="date">วันที่</option>
                  <option value="name">ชื่อ</option>
                  <option value="quantity">จำนวน</option>
                </select>
                <button
                  onClick={() =>
                    onSortChange(sortBy, sortOrder === "asc" ? "desc" : "asc")
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title={sortOrder === "asc" ? "น้อยไปมาก" : "มากไปน้อย"}
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </button>
              </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="md:col-span-3 pt-2">
                <button
                  onClick={onClearFilters}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <RefreshCw size={14} />
                  ล้างตัวกรอง
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-600">
        แสดง {filteredCount} จาก {inventory.length} รายการ
        {hasActiveFilters && (
          <span className="text-fn-orange"> (มีการกรอง)</span>
        )}
      </div>
    </div>
  );
};
