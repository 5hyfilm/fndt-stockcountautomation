// src/components/inventory/InventoryControls.tsx
"use client";

import React from "react";
import { Search, Filter, X, FileText, Trash2, RefreshCw } from "lucide-react";
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

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-4">
      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ค้นหาสินค้า, แบรนด์, หรือบาร์โค้ด..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fn-green focus:border-fn-green"
            />
          </div>
        </div>

        <div className="flex gap-2">
          {/* Export CSV Button */}
          <button
            onClick={onExport}
            disabled={inventory.length === 0 || isExporting}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all duration-200 border shadow-sm ${
              inventory.length === 0 || isExporting
                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 text-white border-green-600 hover:shadow-md transform hover:scale-105"
            }`}
          >
            {isExporting ? (
              <>
                <RefreshCw className="animate-spin" size={16} />
                กำลังส่งออก...
              </>
            ) : (
              <>
                <FileText size={16} />
                ส่งออก CSV
              </>
            )}
          </button>

          <button
            onClick={onClearAll}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm border border-red-600 shadow-sm hover:shadow-md transition-all duration-200"
            disabled={inventory.length === 0}
          >
            <Trash2 size={16} />
            ลบทั้งหมด
          </button>
        </div>
      </div>

      {/* Export Information */}
      {inventory.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-green-700 text-sm">
            <FileText size={16} />
            <span className="font-medium">ข้อมูลที่จะส่งออก:</span>
            <span>
              {inventory.length} รายการสินค้า, {summary.totalItems} ชิ้น
            </span>
            <span>•</span>
            <span>รูปแบบ CSV</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-500" />
          <span className="text-sm text-gray-600">กรอง:</span>
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded text-sm"
        >
          <option value="all">หมวดหมู่ทั้งหมด</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <select
          value={selectedBrand}
          onChange={(e) => onBrandChange(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded text-sm"
        >
          <option value="all">แบรนด์ทั้งหมด</option>
          {brands.map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </select>

        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [sort, order] = e.target.value.split("-");
            onSortChange(sort, order);
          }}
          className="px-3 py-1 border border-gray-300 rounded text-sm"
        >
          <option value="date-desc">วันที่ใหม่สุด</option>
          <option value="date-asc">วันที่เก่าสุด</option>
          <option value="name-asc">ชื่อ A-Z</option>
          <option value="name-desc">ชื่อ Z-A</option>
          <option value="quantity-desc">จำนวนมากสุด</option>
          <option value="quantity-asc">จำนวนน้อยสุด</option>
        </select>

        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1"
          >
            <X size={14} />
            ล้างตัวกรอง
          </button>
        )}
      </div>

      <div className="text-sm text-gray-600">
        แสดง {filteredCount} จาก {inventory.length} รายการ
      </div>
    </div>
  );
};
