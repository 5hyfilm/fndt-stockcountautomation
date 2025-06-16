// src/components/manual-product/ProductPreview.tsx
"use client";

import React, { useState } from "react";
import {
  Eye,
  Package,
  Barcode,
  FileText,
  Globe,
  Tag,
  Calendar,
  User,
  Building2,
  Clock,
  CheckCircle,
  AlertTriangle,
  Edit,
  Save,
  X,
  ArrowLeft,
  Download,
  Share2,
  Copy,
} from "lucide-react";

// Import the form data type
import { ProductEntryFormData } from "./ProductEntryForm";

// ===== INTERFACES =====
interface ProductPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  onEdit: () => void;
  onConfirm: () => Promise<boolean>;
  formData: ProductEntryFormData;
  employeeName?: string;
  branchName?: string;
  estimatedSavingTime?: Date;
}

interface PreviewSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

interface PreviewFieldProps {
  label: string;
  value: string | undefined;
  type?: "text" | "barcode" | "badge" | "multiline";
  copyable?: boolean;
  required?: boolean;
}

interface PreviewStatsProps {
  formData: ProductEntryFormData;
}

interface ConfirmationActionsProps {
  onBack: () => void;
  onEdit: () => void;
  onConfirm: () => void;
  onClose: () => void;
  isLoading: boolean;
}

// ===== UTILITY FUNCTIONS =====
const getBarcodeTypeDisplay = (
  type: "ea" | "dsp" | "cs"
): { label: string; color: string; description: string } => {
  switch (type) {
    case "ea":
      return {
        label: "EA (Each)",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        description: "หน่วยเดี่ยว",
      };
    case "dsp":
      return {
        label: "DSP (Display Pack)",
        color: "bg-green-100 text-green-800 border-green-200",
        description: "แพ็คแสดงสินค้า",
      };
    case "cs":
      return {
        label: "CS (Case/Carton)",
        color: "bg-purple-100 text-purple-800 border-purple-200",
        description: "ลัง/คาร์ตัน",
      };
  }
};

const estimateCSVImpact = (formData: ProductEntryFormData) => {
  return {
    newRowPosition: "แถวสุดท้าย",
    affectedColumns: 9,
    fileSize: "เพิ่มขึ้นประมาณ 0.2KB",
    estimatedLoadTime: "< 1 วินาที",
  };
};

// ===== SUB-COMPONENTS =====
const PreviewSection: React.FC<PreviewSectionProps> = ({
  title,
  icon,
  children,
  className = "",
}) => (
  <div
    className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}
  >
    <div className="flex items-center space-x-2 mb-3">
      {icon}
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
    </div>
    {children}
  </div>
);

const PreviewField: React.FC<PreviewFieldProps> = ({
  label,
  value,
  type = "text",
  copyable = false,
  required = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const renderValue = () => {
    if (!value) {
      return (
        <span className="text-gray-400 italic">
          {required ? "ไม่ได้ระบุ (จำเป็น)" : "ไม่ได้ระบุ"}
        </span>
      );
    }

    switch (type) {
      case "barcode":
        return (
          <div className="flex items-center space-x-2">
            <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
              {value}
            </code>
            {copyable && (
              <button
                onClick={handleCopy}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="คัดลอก"
              >
                <Copy className="w-3 h-3" />
              </button>
            )}
          </div>
        );

      case "badge":
        const barcodeDisplay = getBarcodeTypeDisplay(
          value as "ea" | "dsp" | "cs"
        );
        return (
          <div className="flex items-center space-x-2">
            <span
              className={`px-2 py-1 text-xs border rounded-full ${barcodeDisplay.color}`}
            >
              {barcodeDisplay.label}
            </span>
            <span className="text-xs text-gray-500">
              {barcodeDisplay.description}
            </span>
          </div>
        );

      case "multiline":
        return (
          <div className="whitespace-pre-wrap text-sm text-gray-900">
            {value}
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-900">{value}</span>
            {copyable && (
              <button
                onClick={handleCopy}
                className={`p-1 text-gray-400 hover:text-gray-600 transition-colors ${
                  copied ? "text-green-600" : ""
                }`}
                title={copied ? "คัดลอกแล้ว!" : "คัดลอก"}
              >
                {copied ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            )}
          </div>
        );
    }
  };

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-600">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div>{renderValue()}</div>
    </div>
  );
};

const PreviewStats: React.FC<PreviewStatsProps> = ({ formData }) => {
  const impact = estimateCSVImpact(formData);

  return (
    <PreviewSection
      title="ผลกระทบต่อระบบ"
      icon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
      className="bg-amber-50 border-amber-200"
    >
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div className="space-y-2">
          <div>
            <p className="font-medium text-amber-800">CSV Database</p>
            <p className="text-amber-700">ตำแหน่ง: {impact.newRowPosition}</p>
            <p className="text-amber-700">
              คอลัมน์: {impact.affectedColumns} คอลัมน์
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <div>
            <p className="font-medium text-amber-800">Performance</p>
            <p className="text-amber-700">ขนาดไฟล์: {impact.fileSize}</p>
            <p className="text-amber-700">
              เวลาโหลด: {impact.estimatedLoadTime}
            </p>
          </div>
        </div>
      </div>
    </PreviewSection>
  );
};

const ConfirmationActions: React.FC<ConfirmationActionsProps> = ({
  onBack,
  onEdit,
  onConfirm,
  onClose,
  isLoading,
}) => (
  <div className="flex flex-col sm:flex-row gap-3 p-6 border-t border-gray-200 bg-gray-50">
    <div className="flex gap-3 sm:flex-1">
      <button
        onClick={onBack}
        className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
        disabled={isLoading}
      >
        <ArrowLeft className="w-4 h-4" />
        <span>กลับ</span>
      </button>

      <button
        onClick={onEdit}
        className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center space-x-2"
        disabled={isLoading}
      >
        <Edit className="w-4 h-4" />
        <span>แก้ไข</span>
      </button>

      <button
        onClick={onClose}
        className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        disabled={isLoading}
      >
        ยกเลิก
      </button>
    </div>

    <button
      onClick={onConfirm}
      disabled={isLoading}
      className="flex items-center justify-center space-x-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium rounded-lg transition-colors"
    >
      <Save className="w-4 h-4" />
      <span>{isLoading ? "กำลังบันทึก..." : "ยืนยันและบันทึก"}</span>
    </button>
  </div>
);

// ===== MAIN COMPONENT =====
const ProductPreview: React.FC<ProductPreviewProps> = ({
  isOpen,
  onClose,
  onBack,
  onEdit,
  onConfirm,
  formData,
  employeeName,
  branchName,
  estimatedSavingTime = new Date(),
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle confirm action
  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const success = await onConfirm();
      if (success) {
        // Don't close here - parent component will handle
      }
    } finally {
      setIsSubmitting(false);
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
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Eye className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                ตัวอย่างสินค้าใหม่
              </h3>
              <p className="text-sm text-gray-500">
                ตรวจสอบข้อมูลก่อนบันทึกเข้าระบบ
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

        {/* Content */}
        <div className="max-h-[calc(95vh-200px)] overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Product Information */}
            <div className="space-y-4">
              {/* Barcode Information */}
              <PreviewSection
                title="ข้อมูล Barcode"
                icon={<Barcode className="w-4 h-4 text-blue-600" />}
              >
                <div className="space-y-3">
                  <PreviewField
                    label="Barcode"
                    value={formData.scannedBarcode}
                    type="barcode"
                    copyable
                    required
                  />
                  <PreviewField
                    label="ประเภท Barcode"
                    value={formData.barcodeType}
                    type="badge"
                    required
                  />
                </div>
              </PreviewSection>

              {/* Product Details */}
              <PreviewSection
                title="รายละเอียดสินค้า"
                icon={<Package className="w-4 h-4 text-green-600" />}
              >
                <div className="space-y-3">
                  <PreviewField
                    label="รหัสสินค้า (Material Code)"
                    value={formData.materialCode}
                    copyable
                    required
                  />
                  <PreviewField
                    label="รายละเอียด (English)"
                    value={formData.description}
                    required
                  />
                  <PreviewField
                    label="รายละเอียด (ภาษาไทย)"
                    value={formData.thaiDescription}
                    required
                  />
                </div>
              </PreviewSection>

              {/* Product Classification */}
              <PreviewSection
                title="หมวดหมู่และขนาด"
                icon={<Tag className="w-4 h-4 text-purple-600" />}
              >
                <div className="space-y-3">
                  <PreviewField
                    label="กลุ่มสินค้า (Product Group)"
                    value={formData.productGroup}
                    required
                  />
                  <PreviewField
                    label="ขนาดแพ็ค (Pack Size)"
                    value={formData.packSize}
                    required
                  />
                  <PreviewField
                    label="อายุการเก็บรักษา (เดือน)"
                    value={formData.shelfLife}
                  />
                </div>
              </PreviewSection>
            </div>

            {/* Right Column - Metadata and Validation */}
            <div className="space-y-4">
              {/* Session Information */}
              <PreviewSection
                title="ข้อมูลการบันทึก"
                icon={<User className="w-4 h-4 text-gray-600" />}
              >
                <div className="space-y-3">
                  <PreviewField label="พนักงานที่บันทึก" value={employeeName} />
                  <PreviewField label="สาขา" value={branchName} />
                  <PreviewField
                    label="วันที่และเวลา"
                    value={estimatedSavingTime.toLocaleString("th-TH", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  />
                </div>
              </PreviewSection>

              {/* CSV Preview */}
              <PreviewSection
                title="ข้อมูลที่จะบันทึกใน CSV"
                icon={<FileText className="w-4 h-4 text-indigo-600" />}
              >
                <div className="bg-gray-50 rounded-lg p-3 text-xs font-mono">
                  <div className="space-y-1 text-gray-700">
                    <div>
                      <strong>Material:</strong> {formData.materialCode}
                    </div>
                    <div>
                      <strong>Description:</strong> {formData.description}
                    </div>
                    <div>
                      <strong>Thai Desc.:</strong> {formData.thaiDescription}
                    </div>
                    <div>
                      <strong>Pack Size:</strong> {formData.packSize}
                    </div>
                    <div>
                      <strong>Product Group:</strong> {formData.productGroup}
                    </div>
                    <div>
                      <strong>Shelflife:</strong> {formData.shelfLife || "-"}
                    </div>
                    <div>
                      <strong>Bar Code EA:</strong>{" "}
                      {formData.barcodeType === "ea"
                        ? formData.scannedBarcode
                        : "-"}
                    </div>
                    <div>
                      <strong>Bar Code DSP:</strong>{" "}
                      {formData.barcodeType === "dsp"
                        ? formData.scannedBarcode
                        : "-"}
                    </div>
                    <div>
                      <strong>Bar Code CS:</strong>{" "}
                      {formData.barcodeType === "cs"
                        ? formData.scannedBarcode
                        : "-"}
                    </div>
                  </div>
                </div>
              </PreviewSection>

              {/* Validation Status */}
              <PreviewSection
                title="สถานะการตรวจสอบ"
                icon={<CheckCircle className="w-4 h-4 text-green-600" />}
                className="bg-green-50 border-green-200"
              >
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2 text-green-700">
                    <CheckCircle className="w-4 h-4" />
                    <span>ข้อมูลครบถ้วนและถูกต้อง</span>
                  </div>
                  <div className="flex items-center space-x-2 text-green-700">
                    <CheckCircle className="w-4 h-4" />
                    <span>Barcode ไม่ซ้ำในระบบ</span>
                  </div>
                  <div className="flex items-center space-x-2 text-green-700">
                    <CheckCircle className="w-4 h-4" />
                    <span>รูปแบบข้อมูลถูกต้อง</span>
                  </div>
                </div>
              </PreviewSection>

              {/* System Impact */}
              <PreviewStats formData={formData} />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <ConfirmationActions
          onBack={onBack}
          onEdit={onEdit}
          onConfirm={handleConfirm}
          onClose={onClose}
          isLoading={isSubmitting}
        />
      </div>
    </div>
  );
};

export default ProductPreview;

// ===== EXPORT TYPES =====
export type { ProductPreviewProps };
