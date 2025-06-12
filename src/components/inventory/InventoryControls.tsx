// ./src/components/inventory/InventoryControls.tsx
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
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-fn-green focus:border-fn-green transition-all duration-200 text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 w-full xl:w-auto">
          <button
            onClick={onExport}
            disabled={inventory.length === 0 || isExporting}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium border shadow-sm transition-all duration-200 ${
              inventory.length === 0 || isExporting
                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                : "bg-fn-green text-white border-fn-green hover:bg-[rgb(142,173,62)] hover:border-[rgb(142,173,62)] hover:shadow-md transform hover:scale-[1.02]"
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
                ส่งออกเป็นไฟล์ CSV
              </>
            )}
          </button>

          <button
            onClick={onClearAll}
            className="bg-fn-red hover:bg-red-700 hover:border-red-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium border border-fn-red shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-[1.02]"
            disabled={inventory.length === 0}
          >
            <Trash2 size={16} />
            ลบทั้งหมด
          </button>
        </div>
      </div>

      {/* Export Information */}
      {inventory.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-green-700 text-sm">
            <div className="bg-green-100 p-1.5 rounded-full">
              <FileText size={16} />
            </div>
            <span className="font-medium">ข้อมูลที่จะส่งออก:</span>
            <span className="bg-white px-2 py-1 rounded-lg border border-green-200 font-medium">
              {inventory.length} รายการสินค้า, {summary.totalItems} ชิ้น
            </span>
            <span className="text-green-600">•</span>
            <span className="text-green-600">รูปแบบ CSV</span>
          </div>
        </div>
      )}

      {/* Advanced Filters Section */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Filter Header Button - Always Visible */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors duration-200 group"
        >
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg">
              <Filter className="text-white" size={18} />
            </div>
            <div>
              <h4 className="text-md font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                ตัวกรอง
              </h4>
              <div className="text-sm text-gray-500 flex items-center gap-2">
                {hasActiveFilters ? (
                  <>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      กำลังกรอง
                    </span>
                    <span>
                      แสดง {filteredCount} จาก {inventory.length} รายการ
                    </span>
                  </>
                ) : (
                  <span>กรองข้อมูล สินค้า หมวดหมู่ แบรนด์</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClearFilters();
                }}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 p-1 rounded-lg transition-colors text-xs"
              >
                <X size={14} />
              </button>
            )}
            {showFilters ? (
              <ChevronUp className="text-gray-400" size={20} />
            ) : (
              <ChevronDown className="text-gray-400" size={20} />
            )}
          </div>
        </button>

        {/* Filter Content - Show/Hide */}
        {showFilters && (
          <div className="px-6 pb-6 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  หมวดหมู่สินค้า
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => onCategoryChange(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-fn-green focus:border-fn-green transition-all duration-200 text-sm"
                >
                  <option value="all">ทุกหมวดหมู่</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Brand Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  แบรนด์
                </label>
                <select
                  value={selectedBrand}
                  onChange={(e) => onBrandChange(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-fn-green focus:border-fn-green transition-all duration-200 text-sm"
                >
                  <option value="all">ทุกแบรนด์</option>
                  {brands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เรียงลำดับ
                </label>
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => onSortChange(e.target.value, sortOrder)}
                    className="flex-1 p-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-fn-green focus:border-fn-green transition-all duration-200 text-sm"
                  >
                    <option value="name">ชื่อสินค้า</option>
                    <option value="quantity">จำนวน</option>
                    <option value="date">วันที่เพิ่ม</option>
                  </select>
                  <button
                    onClick={() =>
                      onSortChange(sortBy, sortOrder === "asc" ? "desc" : "asc")
                    }
                    className="px-3 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    {sortOrder === "asc" ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
              <div className="text-sm text-gray-500">
                {hasActiveFilters && (
                  <span>
                    แสดงผล {filteredCount} จากทั้งหมด {inventory.length} รายการ
                  </span>
                )}
              </div>
              {hasActiveFilters && (
                <button
                  onClick={onClearFilters}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <X size={14} />
                  ล้างตัวกรอง
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
