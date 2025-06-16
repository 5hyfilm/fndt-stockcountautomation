// src/components/manual-product/ManualProductManager.tsx
"use client";

import React, { useState, useCallback } from "react";
import { ManualProductDialog } from "./ManualProductDialog";
import ProductEntryForm, { ProductEntryFormData } from "./ProductEntryForm";
import BarcodeVerification, {
  BarcodeVerificationResult,
} from "./BarcodeVerification";
import { Product } from "../../types/product";

// ===== INTERFACES =====
interface ManualProductManagerProps {
  isOpen: boolean;
  onClose: () => void;
  scannedBarcode: string;
  onProductAdded?: (product: Product) => void;
  employeeContext?: {
    employeeName: string;
    branchCode: string;
    branchName: string;
  };
  mode?: "dialog" | "fullscreen" | "modal";
}

interface ManualProductManagerState {
  currentStep: "dialog" | "form" | "verification" | "success";
  formData: Partial<ProductEntryFormData>;
  isSubmitting: boolean;
  error: string | null;
  verificationResult: BarcodeVerificationResult | null;
}

// ===== MAIN COMPONENT =====
const ManualProductManager: React.FC<ManualProductManagerProps> = ({
  isOpen,
  onClose,
  scannedBarcode,
  onProductAdded,
  employeeContext,
  mode = "dialog",
}) => {
  // State management
  const [state, setState] = useState<ManualProductManagerState>({
    currentStep: "dialog",
    formData: {},
    isSubmitting: false,
    error: null,
    verificationResult: null,
  });

  // Update state helper
  const updateState = useCallback(
    (updates: Partial<ManualProductManagerState>) => {
      setState((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  // Handle starting manual product addition
  const handleStartManualEntry = useCallback(() => {
    console.log(
      "🚀 Starting manual product entry for barcode:",
      scannedBarcode
    );
    updateState({
      currentStep: "form",
      formData: { scannedBarcode: scannedBarcode },
    });
  }, [scannedBarcode, updateState]);

  // Handle form submission
  const handleFormSubmit = useCallback(
    async (formData: ProductEntryFormData): Promise<boolean> => {
      console.log("📝 Form submitted:", formData);
      updateState({
        isSubmitting: true,
        error: null,
        formData,
      });

      try {
        // Here you would normally call an API to save the product
        // For now, we'll simulate the process

        // Step 1: Verify barcode
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Step 2: Create product object
        const newProduct: Product = {
          id: `manual-${Date.now()}`,
          material: formData.materialCode,
          name: formData.description,
          thaiName: formData.thaiDescription || formData.description,
          packSize: formData.packSize,
          productGroup: formData.productGroup,
          barcodes: {
            ea:
              formData.barcodeType === "ea"
                ? formData.scannedBarcode
                : undefined,
            dsp:
              formData.barcodeType === "dsp"
                ? formData.scannedBarcode
                : undefined,
            cs:
              formData.barcodeType === "cs"
                ? formData.scannedBarcode
                : undefined,
          },
          category: "BEVERAGES" as any, // Default category
          status: "ACTIVE" as any, // Default status
          createdBy: employeeContext?.employeeName || "Unknown",
          createdAt: new Date(),
          branchCode: employeeContext?.branchCode || "UNKNOWN",
        } as Product;

        console.log("✅ Product created:", newProduct);

        // Update step to success
        updateState({
          currentStep: "success",
          isSubmitting: false,
        });

        // Call callback
        onProductAdded?.(newProduct);

        // Auto-close after success
        setTimeout(() => {
          onClose();
          updateState({ currentStep: "dialog" });
        }, 2000);

        return true; // Success
      } catch (error) {
        console.error("❌ Failed to create product:", error);
        updateState({
          isSubmitting: false,
          error:
            error instanceof Error
              ? error.message
              : "เกิดข้อผิดพลาดในการเพิ่มสินค้า",
        });
        return false; // Failed
      }
    },
    [employeeContext, onProductAdded, onClose, updateState]
  );

  // Handle form cancel
  const handleFormCancel = useCallback(() => {
    console.log("❌ Form cancelled");
    updateState({ currentStep: "dialog" });
  }, [updateState]);

  // Handle close
  const handleClose = useCallback(() => {
    console.log("🔄 Manager closing");
    updateState({
      currentStep: "dialog",
      formData: {},
      isSubmitting: false,
      error: null,
    });
    onClose();
  }, [onClose, updateState]);

  // Handle rescan
  const handleRescan = useCallback(() => {
    console.log("🔄 Rescan requested from manager");
    handleClose();
  }, [handleClose]);

  // Render based on current step
  const renderContent = () => {
    switch (state.currentStep) {
      case "dialog":
        return (
          <ManualProductDialog
            isOpen={isOpen}
            onClose={handleClose}
            scannedBarcode={scannedBarcode}
            onAddNewProduct={handleStartManualEntry}
            onRescan={handleRescan}
            employeeName={employeeContext?.employeeName}
            branchName={employeeContext?.branchName}
            scanTime={new Date()}
          />
        );

      case "form":
        return (
          <ProductEntryForm
            isOpen={true}
            onClose={handleClose}
            onBack={handleFormCancel}
            scannedBarcode={scannedBarcode}
            onSubmit={handleFormSubmit}
            suggestions={{
              productGroups: ["STM", "BB Gold", "EVAP", "SBC", "SCM"],
              materialCodes: ["F123456", "F123457", "F123458"],
              packSizes: ["250ml", "500ml", "1L", "24x250ml"],
            }}
          />
        );

      case "verification":
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold mb-4">ตรวจสอบข้อมูล</h2>
              <BarcodeVerification
                barcode={scannedBarcode}
                barcodeType="ea"
                onVerificationComplete={(result) => {
                  console.log("Verification result:", result);
                  updateState({ verificationResult: result });
                }}
                autoVerify={true}
              />
            </div>
          </div>
        );

      case "success":
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                เพิ่มสินค้าสำเร็จ!
              </h3>
              <p className="text-gray-600 text-sm">
                ข้อมูลสินค้าได้ถูกบันทึกในระบบแล้ว
              </p>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <code className="text-sm text-gray-700">{scannedBarcode}</code>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return renderContent();
};

export default ManualProductManager;
