// src/components/actions/QuickActionsPanel.tsx
"use client";

import React from "react";
import { Zap, History, Bookmark, FileText, BarChart3 } from "lucide-react";
import { Product } from "../../types/product";

interface QuickActionsPanelProps {
  lastScannedProduct?: Product;
  recentScans: string[];
  onQuickScan: () => void;
  onSearchProduct: (barcode: string) => void;
  onViewHistory: () => void;
  onExportData: () => void;
  onShowStats: () => void;
}

export const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({
  lastScannedProduct,
  recentScans,
  onQuickScan,
  onSearchProduct,
  onViewHistory,
  onExportData,
  onShowStats,
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Zap className="fn-green" size={20} />
        Quick Actions
      </h3>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <QuickScanButton onClick={onQuickScan} />
        <QuickHistoryButton onClick={onViewHistory} />
        <QuickExportButton onClick={onExportData} />
        <QuickStatsButton onClick={onShowStats} />
      </div>

      {/* Recent Scans */}
      {recentScans.length > 0 && (
        <RecentScansSection
          recentScans={recentScans}
          onSelectScan={onSearchProduct}
        />
      )}

      {/* Last Product Quick Info */}
      {lastScannedProduct && (
        <LastProductQuickInfo product={lastScannedProduct} />
      )}
    </div>
  );
};

// src/components/actions/QuickScanButton.tsx
interface QuickScanButtonProps {
  onClick: () => void;
}

export const QuickScanButton: React.FC<QuickScanButtonProps> = ({
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className="bg-fn-green hover:bg-fn-green/90 text-white p-3 rounded-lg flex flex-col items-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
    >
      <Zap size={20} />
      <span className="text-sm font-medium">สแกนด่วน</span>
    </button>
  );
};

// src/components/actions/QuickHistoryButton.tsx
interface QuickHistoryButtonProps {
  onClick: () => void;
}

export const QuickHistoryButton: React.FC<QuickHistoryButtonProps> = ({
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg flex flex-col items-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
    >
      <History size={20} />
      <span className="text-sm font-medium">ประวัติ</span>
    </button>
  );
};

// src/components/actions/QuickExportButton.tsx
interface QuickExportButtonProps {
  onClick: () => void;
}

export const QuickExportButton: React.FC<QuickExportButtonProps> = ({
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className="bg-purple-500 hover:bg-purple-600 text-white p-3 rounded-lg flex flex-col items-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
    >
      <FileText size={20} />
      <span className="text-sm font-medium">ส่งออก</span>
    </button>
  );
};

// src/components/actions/QuickStatsButton.tsx
interface QuickStatsButtonProps {
  onClick: () => void;
}

export const QuickStatsButton: React.FC<QuickStatsButtonProps> = ({
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className="bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-lg flex flex-col items-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
    >
      <BarChart3 size={20} />
      <span className="text-sm font-medium">สถิติ</span>
    </button>
  );
};

// src/components/actions/RecentScansSection.tsx
interface RecentScansSectionProps {
  recentScans: string[];
  onSelectScan: (barcode: string) => void;
}

export const RecentScansSection: React.FC<RecentScansSectionProps> = ({
  recentScans,
  onSelectScan,
}) => {
  return (
    <div className="border-t pt-3">
      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
        <History size={14} />
        สแกนล่าสุด
      </h4>
      <div className="space-y-1">
        {recentScans.slice(0, 3).map((barcode, index) => (
          <button
            key={`${barcode}-${index}`}
            onClick={() => onSelectScan(barcode)}
            className="w-full text-left px-2 py-1 text-xs font-mono bg-gray-50 hover:bg-gray-100 rounded border transition-colors"
          >
            {barcode}
          </button>
        ))}
      </div>
    </div>
  );
};

// src/components/actions/LastProductQuickInfo.tsx
interface LastProductQuickInfoProps {
  product: Product;
}

export const LastProductQuickInfo: React.FC<LastProductQuickInfoProps> = ({
  product,
}) => {
  return (
    <div className="border-t pt-3">
      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
        <Bookmark size={14} />
        สินค้าล่าสุด
      </h4>
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="font-medium text-gray-900 text-sm truncate">
          {product.name}
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
          <span className="fn-green font-medium">{product.brand}</span>
          <span>•</span>
          <span>{product.category}</span>
        </div>
        <code className="text-xs text-gray-500 bg-white px-1 py-0.5 rounded mt-1 inline-block">
          {product.barcode}
        </code>
      </div>
    </div>
  );
};
