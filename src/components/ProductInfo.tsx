// src/components/ProductInfo.tsx - Updated with Multi-Barcode Support and Quantity Input
"use client";

import React, { useState } from "react";
import {
  Package,
  Info,
  DollarSign,
  Calendar,
  MapPin,
  Scan,
  ChevronDown,
  ChevronUp,
  Copy,
  CheckCircle,
  AlertTriangle,
  Tag,
  Weight,
  Coffee,
  Plus,
  Minus,
  ShoppingCart,
} from "lucide-react";
import { Product, ProductCategory } from "../types/product";

interface ProductInfoProps {
  product: Product | null;
  barcode?: string;
  isLoading?: boolean;
  error?: string;
}

const getCategoryIcon = (category: ProductCategory) => {
  switch (category) {
    case ProductCategory.BEVERAGES:
      return <Coffee size={16} className="text-blue-500" />;
    case ProductCategory.SNACKS:
      return <Package size={16} className="text-orange-500" />;
    case ProductCategory.DAIRY:
      return <Package size={16} className="text-yellow-500" />;
    default:
      return <Package size={16} className="text-gray-500" />;
  }
};

const getCategoryColor = (category: ProductCategory) => {
  switch (category) {
    case ProductCategory.BEVERAGES:
      return "bg-blue-50 text-blue-800 border-blue-200";
    case ProductCategory.SNACKS:
      return "bg-orange-50 text-orange-800 border-orange-200";
    case ProductCategory.DAIRY:
      return "bg-yellow-50 text-yellow-800 border-yellow-200";
    case ProductCategory.CANNED_FOOD:
      return "bg-green-50 text-green-800 border-green-200";
    case ProductCategory.BAKERY:
      return "bg-amber-50 text-amber-800 border-amber-200";
    case ProductCategory.CONFECTIONERY:
      return "bg-pink-50 text-pink-800 border-pink-200";
    case ProductCategory.INSTANT_NOODLES:
      return "bg-orange-50 text-orange-800 border-orange-200";
    case ProductCategory.SAUCES:
      return "bg-red-50 text-red-800 border-red-200";
    case ProductCategory.SEASONING:
      return "bg-yellow-50 text-yellow-800 border-yellow-200";
    case ProductCategory.FROZEN:
      return "bg-cyan-50 text-cyan-800 border-cyan-200";
    default:
      return "bg-gray-50 text-gray-800 border-gray-200";
  }
};

export const ProductInfo: React.FC<ProductInfoProps> = ({
  product,
  barcode,
  isLoading,
  error,
}) => {
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showNutrition, setShowNutrition] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [showQuantityInput, setShowQuantityInput] = useState(false);

  const copyBarcode = async () => {
    const codeToCopy = barcode || product?.barcode;
    if (!codeToCopy) return;

    try {
      await navigator.clipboard.writeText(codeToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy barcode:", err);
    }
  };

  // ฟังก์ชันจัดการจำนวนสินค้า
  const handleQuantityChange = (value: number) => {
    if (value >= 1 && value <= 999) {
      setQuantity(value);
    }
  };

  const increaseQuantity = () => {
    if (quantity < 999) {
      setQuantity(quantity + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleAddToCart = () => {
    // ฟังก์ชันนี้จะใช้ในอนาคตสำหรับเพิ่มลงตะกร้า
    console.log(`Added ${quantity} of ${product?.name} to cart`);
    alert(
      `เพิ่ม ${product?.name} จำนวน ${quantity} ${
        product?.unit || "ชิ้น"
      } แล้ว!`
    );

    // Reset quantity และซ่อน input
    setQuantity(1);
    setShowQuantityInput(false);
  };

  // แสดง quantity input เมื่อพบสินค้า
  React.useEffect(() => {
    if (product && !error) {
      setShowQuantityInput(true);
    } else {
      setShowQuantityInput(false);
      setQuantity(1);
    }
  }, [product, error]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-4 lg:p-6 shadow-lg border border-gray-200">
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-fn-green border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-gray-600">กำลังค้นหาข้อมูลสินค้า...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl p-4 lg:p-6 shadow-lg border border-gray-200">
        <div className="text-center py-8">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="text-red-500" size={32} />
          </div>
          <p className="text-red-600 font-medium mb-2">ไม่พบข้อมูลสินค้า</p>
          <p className="text-gray-600 text-sm">{error}</p>
          {barcode && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Barcode ที่สแกน:</p>
              <code className="text-sm font-mono text-gray-800">{barcode}</code>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!product && !barcode) {
    return (
      <div className="bg-white rounded-xl p-4 lg:p-6 shadow-lg border border-gray-200">
        <div className="text-center py-8">
          <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
            <Scan className="text-gray-500" size={32} />
          </div>
          <p className="text-gray-700 font-medium mb-2">รอการสแกน</p>
          <p className="text-gray-500 text-sm">
            วางบาร์โค้ดในกรอบกล้องเพื่อดูข้อมูลสินค้า
          </p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-white rounded-xl p-4 lg:p-6 shadow-lg border border-gray-200">
        <div className="text-center py-8">
          <div className="bg-yellow-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
            <Package className="text-yellow-600" size={32} />
          </div>
          <p className="text-yellow-600 font-medium mb-2">ไม่พบข้อมูลสินค้า</p>
          <p className="text-gray-600 text-sm mb-4">
            สินค้านี้ยังไม่มีในฐานข้อมูล
          </p>
          {barcode && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Barcode:</p>
                  <code className="text-sm font-mono text-gray-800">
                    {barcode}
                  </code>
                </div>
                <button
                  onClick={copyBarcode}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-fn-green to-fn-red/80 text-white p-4 lg:p-6">
        <div className="flex items-start gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
            <Package size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg lg:text-xl font-bold mb-1 leading-tight">
              {product.name}
            </h3>
            {product.name_en && (
              <p className="text-white/80 text-sm">{product.name_en}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${getCategoryColor(
                  product.category
                )}`}
              >
                {getCategoryIcon(product.category)}
                {product.category}
              </span>
              <span className="text-white/90 text-sm font-medium">
                {product.brand}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 lg:p-6 space-y-4">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Weight size={16} className="text-gray-500" />
              <span className="text-sm text-gray-600">ขนาด</span>
            </div>
            <p className="font-semibold text-gray-900">
              {product.size} {product.unit}
            </p>
          </div>

          {product.price && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign size={16} className="text-green-500" />
                <span className="text-sm text-gray-600">ราคา</span>
              </div>
              <p className="font-semibold text-green-600">
                ฿{product.price.toFixed(2)}
              </p>
            </div>
          )}
        </div>

        {/* Quantity Input Section */}
        {showQuantityInput && (
          <div className="bg-gradient-to-r from-fn-green/10 to-fn-red/10 border border-fn-green/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-fn-green/20 p-2 rounded-lg">
                <ShoppingCart size={16} className="fn-green" />
              </div>
              <span className="text-lg font-semibold text-gray-800">
                เพิ่มลงตะกร้า
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* Quantity Controls */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 min-w-[60px]">
                  จำนวน:
                </span>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={decreaseQuantity}
                    disabled={quantity <= 1}
                    className="bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 px-3 py-2 transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) =>
                      handleQuantityChange(parseInt(e.target.value) || 1)
                    }
                    min="1"
                    max="999"
                    className="w-16 text-center py-2 border-none outline-none bg-white text-gray-900 font-medium"
                  />
                  <button
                    onClick={increaseQuantity}
                    disabled={quantity >= 999}
                    className="bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 px-3 py-2 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <span className="text-sm text-gray-600">
                  {product.unit || "ชิ้น"}
                </span>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                className="bg-fn-green hover:bg-fn-green/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 border border-fn-green ml-auto"
              >
                <ShoppingCart size={16} />
                <span>เพิ่มลงตะกร้า</span>
              </button>
            </div>
          </div>
        )}

        {/* Description */}
        {product.description && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Info size={16} className="text-blue-500" />
              <span className="text-sm font-medium text-blue-800">
                รายละเอียด
              </span>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">
              {product.description}
            </p>
          </div>
        )}

        {/* Enhanced Barcode Info */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scan size={16} className="text-gray-500" />
              <span className="text-sm text-gray-600">Barcode</span>
            </div>
            <button
              onClick={copyBarcode}
              className="text-gray-500 hover:text-gray-700 p-1 rounded"
            >
              {copied ? (
                <CheckCircle size={16} className="text-green-500" />
              ) : (
                <Copy size={16} />
              )}
            </button>
          </div>
          <code className="text-sm font-mono text-gray-800 block mt-1">
            {product.barcode}
          </code>
          {product.barcode_type && (
            <span className="text-xs text-gray-500">
              ({product.barcode_type})
            </span>
          )}

          {/* Show scanned barcode info if different */}
          {barcode && barcode !== product.barcode && (
            <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
              📦 บาร์โค้ดที่สแกน: {barcode}
            </div>
          )}
        </div>

        {/* Additional Details Toggle */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <span className="text-sm font-medium text-gray-700">
            ข้อมูลเพิ่มเติม
          </span>
          {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {/* Detailed Information */}
        {showDetails && (
          <div className="space-y-3 border-t pt-4">
            {product.sku && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">SKU:</span>
                <span className="text-sm font-mono">{product.sku}</span>
              </div>
            )}

            {product.country_of_origin && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <MapPin size={12} />
                  ประเทศต้นกำเนิด:
                </span>
                <span className="text-sm">{product.country_of_origin}</span>
              </div>
            )}

            {product.storage_instructions && (
              <div>
                <span className="text-sm text-gray-600 block mb-1">
                  วิธีเก็บรักษา:
                </span>
                <p className="text-sm text-gray-800 bg-amber-50 p-2 rounded border border-amber-200">
                  {product.storage_instructions}
                </p>
              </div>
            )}

            {product.ingredients && product.ingredients.length > 0 && (
              <div>
                <span className="text-sm text-gray-600 block mb-1">
                  ส่วนประกอบ:
                </span>
                <p className="text-xs text-gray-700 bg-gray-50 p-2 rounded">
                  {product.ingredients.join(", ")}
                </p>
              </div>
            )}

            {product.allergens && product.allergens.length > 0 && (
              <div>
                <span className="text-sm text-gray-600 block mb-1">
                  สารก่อภูมิแพ้:
                </span>
                <p className="text-xs text-red-700 bg-red-50 p-2 rounded border border-red-200">
                  {product.allergens.join(", ")}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Nutrition Information */}
        {product.nutrition_info && (
          <>
            <button
              onClick={() => setShowNutrition(!showNutrition)}
              className="w-full flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
            >
              <span className="text-sm font-medium text-green-700">
                ข้อมูลโภชนาการ
              </span>
              {showNutrition ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </button>

            {showNutrition && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {product.nutrition_info.serving_size && (
                    <div className="col-span-2 text-center border-b border-green-200 pb-2 mb-2">
                      <span className="font-medium">
                        ขนาดบริโภค: {product.nutrition_info.serving_size}
                      </span>
                    </div>
                  )}

                  {product.nutrition_info.calories_per_serving && (
                    <div className="flex justify-between">
                      <span>แคลอรี่:</span>
                      <span className="font-medium">
                        {product.nutrition_info.calories_per_serving} kcal
                      </span>
                    </div>
                  )}

                  {product.nutrition_info.protein && (
                    <div className="flex justify-between">
                      <span>โปรตีน:</span>
                      <span className="font-medium">
                        {product.nutrition_info.protein} g
                      </span>
                    </div>
                  )}

                  {product.nutrition_info.carbohydrates && (
                    <div className="flex justify-between">
                      <span>คาร์โบไหเดรต:</span>
                      <span className="font-medium">
                        {product.nutrition_info.carbohydrates} g
                      </span>
                    </div>
                  )}

                  {product.nutrition_info.sugar && (
                    <div className="flex justify-between">
                      <span>น้ำตาล:</span>
                      <span className="font-medium">
                        {product.nutrition_info.sugar} g
                      </span>
                    </div>
                  )}

                  {product.nutrition_info.fat && (
                    <div className="flex justify-between">
                      <span>ไขมัน:</span>
                      <span className="font-medium">
                        {product.nutrition_info.fat} g
                      </span>
                    </div>
                  )}

                  {product.nutrition_info.sodium && (
                    <div className="flex justify-between">
                      <span>โซเดียม:</span>
                      <span className="font-medium">
                        {product.nutrition_info.sodium} mg
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
