// src/components/manual-product/ManualProductDialog.tsx
"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Barcode,
  Clock,
  User,
  Building2,
  Plus,
  X,
  Search,
} from "lucide-react";

// ===== INTERFACES =====
interface ManualProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  scannedBarcode: string;
  onAddNewProduct: (barcode: string) => void;
  onRescan?: () => void;
  employeeName?: string;
  branchName?: string;
  scanTime?: Date;
}

interface DialogHeaderProps {
  onClose: () => void;
}

interface BarcodeInfoProps {
  barcode: string;
  scanTime: Date;
  employeeName?: string;
  branchName?: string;
}

interface DialogActionsProps {
  onClose: () => void;
  onAddNewProduct: () => void;
  onRescan?: () => void;
  isLoading?: boolean;
}

// ===== SUB-COMPONENTS =====
const DialogHeader: React.FC<DialogHeaderProps> = ({ onClose }) => (
  <div className="flex items-center justify-between p-6 border-b border-gray-200">
    <div className="flex items-center space-x-3">
      <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
        <AlertTriangle className="w-5 h-5 text-amber-600" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          ไม่พบสินค้าในระบบ
        </h3>
        <p className="text-sm text-gray-500">
          Barcode ที่สแกนไม่มีในฐานข้อมูลสินค้า
        </p>
      </div>
    </div>
    <button
      onClick={onClose}
      className="text-gray-400 hover:text-gray-600 transition-colors"
      aria-label="ปิด"
    >
      <X className="w-6 h-6" />
    </button>
  </div>
);

const BarcodeInfo: React.FC<BarcodeInfoProps> = ({
  barcode,
  scanTime,
  employeeName,
  branchName,
}) => (
  <div className="p-6 space-y-4">
    {/* Barcode Display */}
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Barcode className="w-5 h-5 text-gray-600" />
          <div>
            <p className="text-sm font-medium text-gray-900">Barcode</p>
            <p className="text-lg font-mono text-gray-700 mt-1">{barcode}</p>
          </div>
        </div>
        <button
          onClick={() => navigator.clipboard?.writeText(barcode)}
          className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded transition-colors"
          title="คัดลอก barcode"
        >
          คัดลอก
        </button>
      </div>
    </div>

    {/* Scan Information */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="flex items-center space-x-3">
        <Clock className="w-4 h-4 text-gray-500" />
        <div>
          <p className="text-xs text-gray-500">เวลาสแกน</p>
          <p className="text-sm font-medium text-gray-900">
            {scanTime.toLocaleString("th-TH", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>

      {employeeName && (
        <div className="flex items-center space-x-3">
          <User className="w-4 h-4 text-gray-500" />
          <div>
            <p className="text-xs text-gray-500">พนักงาน</p>
            <p className="text-sm font-medium text-gray-900">{employeeName}</p>
          </div>
        </div>
      )}

      {branchName && (
        <div className="flex items-center space-x-3 md:col-span-2">
          <Building2 className="w-4 h-4 text-gray-500" />
          <div>
            <p className="text-xs text-gray-500">สาขา</p>
            <p className="text-sm font-medium text-gray-900">{branchName}</p>
          </div>
        </div>
      )}
    </div>

    {/* Help Text */}
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <p className="text-sm text-blue-800">
        <strong>💡 คำแนะนำ:</strong> คุณสามารถเพิ่มสินค้าใหม่นี้เข้าสู่ระบบ
        หรือสแกน barcode อื่นแทน
      </p>
    </div>
  </div>
);

const DialogActions: React.FC<DialogActionsProps> = ({
  onClose,
  onAddNewProduct,
  onRescan,
  isLoading = false,
}) => (
  <div className="flex flex-col sm:flex-row gap-3 p-6 border-t border-gray-200 bg-gray-50">
    {/* Secondary Actions */}
    <div className="flex gap-3 sm:flex-1">
      <button
        onClick={onClose}
        className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        disabled={isLoading}
      >
        ข้าม
      </button>

      {onRescan && (
        <button
          onClick={onRescan}
          className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
          disabled={isLoading}
        >
          <Search className="w-4 h-4" />
          <span>สแกนใหม่</span>
        </button>
      )}
    </div>

    {/* Primary Action */}
    <button
      onClick={onAddNewProduct}
      disabled={isLoading}
      className="flex items-center justify-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
    >
      <Plus className="w-4 h-4" />
      <span>{isLoading ? "กำลังดำเนินการ..." : "เพิ่มสินค้าใหม่"}</span>
    </button>
  </div>
);

// ===== MAIN COMPONENT =====
const ManualProductDialog: React.FC<ManualProductDialogProps> = ({
  isOpen,
  onClose,
  scannedBarcode,
  onAddNewProduct,
  onRescan,
  employeeName,
  branchName,
  scanTime = new Date(),
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Handle add new product
  const handleAddNewProduct = async () => {
    setIsLoading(true);
    try {
      await onAddNewProduct(scannedBarcode);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent background scroll
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader onClose={onClose} />

        <BarcodeInfo
          barcode={scannedBarcode}
          scanTime={scanTime}
          employeeName={employeeName}
          branchName={branchName}
        />

        <DialogActions
          onClose={onClose}
          onAddNewProduct={handleAddNewProduct}
          onRescan={onRescan}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default ManualProductDialog;

// ===== EXPORT TYPES =====
export type { ManualProductDialogProps };
