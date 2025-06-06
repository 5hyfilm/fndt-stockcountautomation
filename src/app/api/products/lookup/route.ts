// src/app/api/products/lookup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { findProductByBarcode } from "@/data/products";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barcode = searchParams.get("barcode");

    console.log("🔍 Looking up product for barcode:", barcode);

    if (!barcode) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่มี barcode ในคำขอ",
        },
        { status: 400 }
      );
    }

    // Clean barcode (remove spaces, special characters)
    const cleanBarcode = barcode.trim().replace(/[^0-9]/g, "");

    console.log("🧹 Clean barcode:", cleanBarcode);

    // Find product by exact barcode match
    let product = findProductByBarcode(cleanBarcode);

    // If not found, try with original barcode
    if (!product && cleanBarcode !== barcode) {
      product = findProductByBarcode(barcode.trim());
    }

    if (product) {
      console.log("✅ Product found:", product.name);
      return NextResponse.json({
        success: true,
        data: product,
      });
    } else {
      console.log("❌ Product not found for barcode:", barcode);

      // Log all available barcodes for debugging
      const availableBarcodes = require("@/data/products").MOCK_PRODUCTS.map(
        (p) => p.barcode
      );
      console.log("📋 Available barcodes:", availableBarcodes);

      return NextResponse.json(
        {
          success: false,
          error: `ไม่พบสินค้าที่มี barcode: ${barcode}`,
          debug: {
            searchedBarcode: barcode,
            cleanBarcode: cleanBarcode,
            availableBarcodes: availableBarcodes,
          },
        },
        { status: 404 }
      );
    }
  } catch (error: any) {
    console.error("❌ Error in product lookup:", error);
    return NextResponse.json(
      {
        success: false,
        error: `เกิดข้อผิดพลาดในการค้นหาสินค้า: ${error.message}`,
      },
      { status: 500 }
    );
  }
}
