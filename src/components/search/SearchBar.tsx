// src/components/search/SearchBar.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Search, X, Filter, ScanLine } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
  showScanButton?: boolean;
  onScanClick?: () => void;
  showFilterButton?: boolean;
  onFilterClick?: () => void;
  isLoading?: boolean;
  debounceMs?: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onClear,
  placeholder = "ค้นหาสินค้า, แบรนด์, หรือบาร์โค้ด...",
  showScanButton = false,
  onScanClick,
  showFilterButton = false,
  onFilterClick,
  isLoading = false,
  debounceMs = 300,
}) => {
  const [localValue, setLocalValue] = useState(value);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, value, onChange, debounceMs]);

  // Sync with external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleClear = () => {
    setLocalValue("");
    onClear();
  };

  return (
    <div className="relative flex items-center gap-2">
      <div className="relative flex-1">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={16}
        />
        <input
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fn-green focus:border-fn-green transition-colors"
        />

        {/* Clear button */}
        {localValue && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin w-4 h-4 border-2 border-fn-green border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {/* Scan button */}
      {showScanButton && onScanClick && (
        <button
          onClick={onScanClick}
          className="bg-fn-green hover:bg-fn-green/90 text-white p-2 rounded-lg transition-colors"
          title="สแกนบาร์โค้ด"
        >
          <ScanLine size={16} />
        </button>
      )}

      {/* Filter button */}
      {showFilterButton && onFilterClick && (
        <button
          onClick={onFilterClick}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg transition-colors"
          title="ตัวกรอง"
        >
          <Filter size={16} />
        </button>
      )}
    </div>
  );
};

// src/components/search/FilterPanel.tsx
interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    category: {
      value: string;
      options: FilterOption[];
      onChange: (value: string) => void;
    };
    brand: {
      value: string;
      options: FilterOption[];
      onChange: (value: string) => void;
    };
    sortBy: {
      value: string;
      onChange: (value: string) => void;
    };
    sortOrder: {
      value: "asc" | "desc";
      onChange: (value: "asc" | "desc") => void;
    };
  };
  onClearAll: () => void;
  activeFiltersCount: number;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  isOpen,
  onClose,
  filters,
  onClearAll,
  activeFiltersCount,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose}>
      <div
        className="absolute top-0 right-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">ตัวกรอง</h3>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <span className="bg-fn-green text-white text-xs px-2 py-1 rounded-full">
                {activeFiltersCount}
              </span>
            )}
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-6 h-full overflow-y-auto">
          {/* Category Filter */}
          <FilterGroup
            title="หมวดหมู่"
            value={filters.category.value}
            options={filters.category.options}
            onChange={filters.category.onChange}
          />

          {/* Brand Filter */}
          <FilterGroup
            title="แบรนด์"
            value={filters.brand.value}
            options={filters.brand.options}
            onChange={filters.brand.onChange}
          />

          {/* Sort Options */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">เรียงตาม</h4>
            <select
              value={`${filters.sortBy.value}-${filters.sortOrder.value}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split("-");
                filters.sortBy.onChange(sortBy);
                filters.sortOrder.onChange(sortOrder as "asc" | "desc");
              }}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="date-desc">วันที่ใหม่สุด</option>
              <option value="date-asc">วันที่เก่าสุด</option>
              <option value="name-asc">ชื่อ A-Z</option>
              <option value="name-desc">ชื่อ Z-A</option>
              <option value="quantity-desc">จำนวนมากสุด</option>
              <option value="quantity-asc">จำนวนน้อยสุด</option>
            </select>
          </div>

          {/* Clear All */}
          {activeFiltersCount > 0 && (
            <button
              onClick={onClearAll}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg transition-colors"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// src/components/search/FilterGroup.tsx
interface FilterGroupProps {
  title: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  maxVisible?: number;
}

export const FilterGroup: React.FC<FilterGroupProps> = ({
  title,
  value,
  options,
  onChange,
  maxVisible = 8,
}) => {
  const [showAll, setShowAll] = useState(false);
  const visibleOptions = showAll ? options : options.slice(0, maxVisible);

  return (
    <div>
      <h4 className="font-medium text-gray-900 mb-3">{title}</h4>
      <div className="space-y-2">
        <label className="flex items-center">
          <input
            type="radio"
            name={title}
            value="all"
            checked={value === "all"}
            onChange={() => onChange("all")}
            className="mr-2 text-fn-green"
          />
          <span className="text-sm">ทั้งหมด</span>
        </label>

        {visibleOptions.map((option) => (
          <label
            key={option.value}
            className="flex items-center justify-between"
          >
            <div className="flex items-center">
              <input
                type="radio"
                name={title}
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
                className="mr-2 text-fn-green"
              />
              <span className="text-sm">{option.label}</span>
            </div>
            {option.count && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {option.count}
              </span>
            )}
          </label>
        ))}

        {options.length > maxVisible && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-fn-green text-sm hover:underline"
          >
            {showAll ? "แสดงน้อยลง" : `แสดงทั้งหมด (${options.length})`}
          </button>
        )}
      </div>
    </div>
  );
};

// src/components/search/SearchResults.tsx
interface SearchResultsProps {
  query: string;
  results: any[];
  isLoading: boolean;
  totalResults: number;
  onSelectResult: (result: any) => void;
  renderResult: (result: any) => React.ReactNode;
  emptyMessage?: string;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  query,
  results,
  isLoading,
  totalResults,
  onSelectResult,
  renderResult,
  emptyMessage = "ไม่พบผลลัพธ์",
}) => {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-4 border-fn-green border-t-transparent rounded-full mx-auto mb-3"></div>
        <p className="text-gray-600">กำลังค้นหา...</p>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Search size={32} className="mx-auto mb-3 opacity-50" />
        <p>พิมพ์เพื่อค้นหาสินค้า</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Search size={32} className="mx-auto mb-3 opacity-50" />
        <p>{emptyMessage}</p>
        <p className="text-sm mt-2">ลองค้นหาด้วยคำอื่น หรือสแกนบาร์โค้ด</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 text-sm text-gray-600">
        พบ {totalResults} ผลลัพธ์สำหรับ "{query}"
      </div>
      <div className="space-y-2">
        {results.map((result, index) => (
          <div
            key={`${result.id || result.barcode}-${index}`}
            onClick={() => onSelectResult(result)}
            className="cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
          >
            {renderResult(result)}
          </div>
        ))}
      </div>
    </div>
  );
};
