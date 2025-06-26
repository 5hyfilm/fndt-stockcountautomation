// ./src/components/layout/MobileProductSlide.tsx
"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { X, Plus } from "lucide-react";
import { Product } from "../../types/product";
import { ProductInfo } from "../ProductInfo";
import { QuantityInput } from "../../hooks/inventory/types";

interface MobileProductSlideProps {
  isVisible: boolean;
  product: Product | null;
  detectedBarcodeType?: "ea" | "dsp" | "cs";
  currentInventoryQuantity: number;
  scannedBarcode?: string;
  productError?: string;
  onClose: () => void;
  onAddToInventory: (
    product: Product,
    quantityInput: QuantityInput,
    barcodeType?: "ea" | "dsp" | "cs"
  ) => boolean;
  onAddNewProduct?: (barcode: string) => void;
  children?: React.ReactNode;
}

export const MobileProductSlide: React.FC<MobileProductSlideProps> = ({
  isVisible,
  product,
  detectedBarcodeType,
  currentInventoryQuantity,
  scannedBarcode = "",
  productError,
  onClose,
  onAddToInventory,
  onAddNewProduct,
  children,
}) => {
  const [, setIsAnimating] = useState(false);

  // 🆕 Drag state management
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [currentTranslateY, setCurrentTranslateY] = useState(0);

  const slideRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // 🆕 Constants for drag behavior
  const CLOSE_THRESHOLD = 100; // distance to close when swiping down

  // 🆕 Calculate safe modal height for mobile (prevents overflow on mobile devices)
  const calculateModalHeight = () => {
    const vh = window.innerHeight;
    const safeBottom = 20; // padding from bottom edge
    const maxHeight = Math.min(vh * 0.7, vh - safeBottom); // Max 70vh or screen height minus safe padding
    return `${maxHeight}px`;
  };

  // Handle slide animation
  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      setCurrentTranslateY(0); // Reset ตำแหน่งเมื่อเปิด
      const timer = setTimeout(() => setIsAnimating(false), 400);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  // 🆕 Update modal height on window resize
  useEffect(() => {
    const handleResize = () => {
      // Force re-render to recalculate modal height
      if (slideRef.current && isVisible) {
        slideRef.current.style.maxHeight = calculateModalHeight();
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [isVisible]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isVisible]);

  // 🆕 Touch/Mouse event handlers
  const handleStart = useCallback((clientY: number) => {
    setIsDragging(true);
    setDragStartY(clientY);
  }, []);

  const handleMove = useCallback(
    (clientY: number) => {
      if (!isDragging) return;

      const deltaY = clientY - dragStartY;

      // ให้ลากลงได้เท่านั้น (deltaY > 0)
      if (deltaY > 0) {
        setCurrentTranslateY(Math.min(deltaY, window.innerHeight * 0.7));
      }
      // ไม่ให้ลากขึ้น - ไม่ทำอะไรเลยถ้า deltaY <= 0
    },
    [isDragging, dragStartY]
  );

  const handleEnd = useCallback(() => {
    if (!isDragging) return;

    // ถ้าลากลงเกิน threshold ให้ปิด modal
    if (currentTranslateY > CLOSE_THRESHOLD) {
      onClose();
    } else {
      // Snap กลับไปตำแหน่งเดิม
      setCurrentTranslateY(0);
    }

    setIsDragging(false);
    setDragStartY(0);
  }, [isDragging, currentTranslateY, onClose]);

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientY);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      handleMove(e.clientY);
    },
    [handleMove]
  );

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      handleEnd();
    },
    [handleEnd]
  );

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientY);
  };

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      e.preventDefault(); // ป้องกันการ scroll
      handleMove(e.touches[0].clientY);
    },
    [handleMove]
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      e.preventDefault();
      handleEnd();
    },
    [handleEnd]
  );

  // Setup global event listeners สำหรับ drag
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleTouchEnd);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [
    isDragging,
    handleMouseMove,
    handleMouseUp,
    handleTouchMove,
    handleTouchEnd,
  ]);

  // Dynamic header title based on product status
  const getHeaderTitle = () => {
    if (product) {
      return "ข้อมูลสินค้า";
    } else if (productError) {
      return "ไม่พบสินค้า";
    } else {
      return "ผลการสแกน";
    }
  };

  // Handler สำหรับเพิ่มสินค้าใหม่
  const handleAddNewProduct = () => {
    if (onAddNewProduct && scannedBarcode) {
      onAddNewProduct(scannedBarcode);
    }
  };

  // ตรวจสอบว่าควรแสดงปุ่ม "เพิ่มสินค้าใหม่" หรือไม่
  const shouldShowAddNewProductButton = () => {
    return !product && productError && scannedBarcode && onAddNewProduct;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 transition-opacity duration-300 z-40 ${
          isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Slide Up Panel */}
      <div
        ref={slideRef}
        className={`fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl transition-all duration-400 ease-out ${
          isVisible ? "translate-y-0" : "translate-y-full"
        }`}
        style={{
          maxHeight: calculateModalHeight(), // ใช้ function คำนวณความสูงที่เหมาะสม
          minHeight: "300px", // ความสูงขั้นต่ำในหน่วย px
          height: "auto", // ให้ปรับตามเนื้อหา
          transform: `translateY(${currentTranslateY}px)`,
          willChange: "transform",
          transition: isDragging ? "none" : "transform 0.4s ease-out",
          paddingBottom: "env(safe-area-inset-bottom, 10px)", // Safe area support
        }}
      >
        {/* 🆕 Enhanced Draggable Handle Bar */}
        <div
          ref={handleRef}
          className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div
            className={`w-10 h-1 rounded-full transition-colors duration-200 ${
              isDragging ? "bg-gray-500" : "bg-gray-300 hover:bg-gray-400"
            }`}
          />
        </div>

        {/* Dynamic Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {getHeaderTitle()}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* 🎯 Enhanced Content Area with Custom Scrollbar */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto custom-scrollbar px-1"
          style={{
            // กำหนดความสูงที่เหลือให้กับ content area
            maxHeight: `calc(${calculateModalHeight()} - 140px)`, // ลบความสูงของ header และ footer
            // 🆕 Enhanced scrollbar styling for better mobile experience
            scrollBehavior: "smooth",
            WebkitOverflowScrolling: "touch", // Smooth scrolling บน iOS
          }}
        >
          <div className="px-3 pb-2">
            <ProductInfo
              product={product}
              barcode={scannedBarcode}
              barcodeType={detectedBarcodeType}
              isLoading={false}
              error={productError}
              onAddToInventory={onAddToInventory}
              currentInventoryQuantity={currentInventoryQuantity}
            />
            {/* Custom Content */}
            {children}
            {/* 🆕 Extra padding for better scroll experience */}
            <div className="h-4" />{" "}
            {/* Extra space at bottom for comfortable scrolling */}
          </div>
        </div>

        {/* 🚫 Removed Scan Next Button - Only show Add New Product button when needed */}
        {shouldShowAddNewProductButton() && (
          <div
            className="px-4 py-4 border-t border-gray-100 bg-white"
            style={{
              paddingBottom: "max(16px, env(safe-area-inset-bottom))",
            }}
          >
            <button
              onClick={handleAddNewProduct}
              className="w-full bg-fn-green text-white py-3 px-4 rounded-lg font-medium transition-colors hover:bg-fn-green/90 flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              เพิ่มสินค้าใหม่
            </button>
          </div>
        )}
      </div>
    </>
  );
};
