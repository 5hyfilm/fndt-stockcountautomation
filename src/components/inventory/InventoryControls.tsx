// src/components/inventory/InventoryControls.tsx
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
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ค้นหาสินค้า, แบรนด์, หรือบาร์โค้ด..."
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-fn-green focus:border-fn-green transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
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

        <div className="flex flex-wrap gap-3">
          {/* Export CSV Button */}
          <button
            onClick={onExport}
            disabled={inventory.length === 0 || isExporting}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition-all duration-200 border shadow-sm ${
              inventory.length === 0 || isExporting
                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                : "bg-fn-green hover:bg-green-700 text-white border-fn-green hover:shadow-md transform hover:scale-[1.02]"
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
            className="bg-fn-red hover:bg-red-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium border border-fn-red shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-[1.02]"
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
                Filter
              </h4>
              <div className="text-sm text-gray-500 flex items-center gap-2">
                {hasActiveFilters ? (
                  <>
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-medium">
                      {
                        [
                          searchTerm && "ค้นหา",
                          selectedCategory !== "all" && "หมวดหมู่",
                          selectedBrand !== "all" && "แบรนด์",
                        ].filter(Boolean).length
                      }{" "}
                      filter ที่ใช้
                    </span>
                    <span>•</span>
                    <span>
                      แสดง {filteredCount} จาก {inventory.length} รายการ
                    </span>
                  </>
                ) : (
                  <span>ไม่มี filter ที่ใช้งาน</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right text-sm text-gray-500">
              {showFilters ? "ซ่อน filter" : "แสดง filter"}
            </div>
            <div className="p-1 rounded-full bg-gray-100 group-hover:bg-blue-500/10 transition-colors">
              {showFilters ? (
                <ChevronUp
                  size={16}
                  className="text-gray-600 group-hover:text-blue-600 transition-colors"
                />
              ) : (
                <ChevronDown
                  size={16}
                  className="text-gray-600 group-hover:text-blue-600 transition-colors"
                />
              )}
            </div>
          </div>
        </button>

        {/* Dropdown Content */}
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            showFilters ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-6 pb-6">
            {/* Divider */}
            <div className="border-t border-gray-200 mb-4"></div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {/* Category Filter */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600 block">
                  📂 หมวดหมู่สินค้า
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => onCategoryChange(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                >
                  <option value="all">
                    ทั้งหมด ({categories.length} หมวดหมู่)
                  </option>
                  {categories.map((category) => {
                    const count = inventory.filter(
                      (item) => item.category === category
                    ).length;
                    return (
                      <option key={category} value={category}>
                        {category} ({count} รายการ)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Brand Filter */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600 block">
                  🏷️ แบรนด์สินค้า
                </label>
                <select
                  value={selectedBrand}
                  onChange={(e) => onBrandChange(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                >
                  <option value="all">ทั้งหมด ({brands.length} แบรนด์)</option>
                  {brands.map((brand) => {
                    const count = inventory.filter(
                      (item) => item.brand === brand
                    ).length;
                    return (
                      <option key={brand} value={brand}>
                        {brand} ({count} รายการ)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Sort Filter */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600 block">
                  🔄 เรียงลำดับ
                </label>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [sort, order] = e.target.value.split("-");
                    onSortChange(sort, order);
                  }}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                >
                  <option value="date-desc">📅 วันที่ใหม่สุด</option>
                  <option value="date-asc">📅 วันที่เก่าสุด</option>
                  <option value="name-asc">🔤 ชื่อ A-Z</option>
                  <option value="name-desc">🔤 ชื่อ Z-A</option>
                  <option value="quantity-desc">📦 จำนวนมากสุด</option>
                  <option value="quantity-asc">📦 จำนวนน้อยสุด</option>
                </select>
              </div>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="bg-blue-50 rounded-lg p-3 mb-4">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs font-medium text-blue-700">
                    filter ที่ใช้งาน:
                  </span>
                  {searchTerm && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      🔍 "{searchTerm}"
                      <button
                        onClick={() => onSearchChange("")}
                        className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  )}
                  {selectedCategory !== "all" && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      📂 {selectedCategory}
                      <button
                        onClick={() => onCategoryChange("all")}
                        className="hover:bg-green-200 rounded-full p-0.5 transition-colors"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  )}
                  {selectedBrand !== "all" && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                      🏷️ {selectedBrand}
                      <button
                        onClick={() => onBrandChange("all")}
                        className="hover:bg-orange-200 rounded-full p-0.5 transition-colors"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Clear All Filters Button */}
            {hasActiveFilters && (
              <div className="flex justify-center">
                <button
                  onClick={onClearFilters}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm flex items-center gap-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-all duration-200"
                >
                  <X size={14} />
                  ล้าง filter ทั้งหมด
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
