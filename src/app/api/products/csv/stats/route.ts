// src/app/api/products/csv/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { csvUpdateService } from "../../../../../services/csvUpdateService";

// ===== MAIN HANDLER =====
export async function GET(): Promise<NextResponse> {
  try {
    const stats = await csvUpdateService.getCSVStatistics();

    return NextResponse.json({
      success: true,
      data: {
        totalProducts: stats.totalProducts,
        fileSize: stats.fileSize,
        lastModified: stats.lastModified,
        barcodeStats: stats.barcodeStats,
        productGroups: stats.productGroups,
      },
    });
  } catch (error) {
    console.error("CSV stats API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get CSV statistics",
        data: {
          totalProducts: 0,
          fileSize: 0,
          lastModified: new Date(),
          barcodeStats: { withEA: 0, withDSP: 0, withCS: 0, total: 0 },
          productGroups: {},
        },
      },
      { status: 500 }
    );
  }
}

// ===== OPTIONS METHOD - CORS =====
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
