// src/app/api/products/csv/health/route.ts
import { NextRequest, NextResponse } from "next/server";
import { csvUpdateService } from "../../../../../services/csvUpdateService";

// ===== MAIN HANDLER =====
export async function GET(): Promise<NextResponse> {
  try {
    const health = await csvUpdateService.healthCheck();

    const isHealthy =
      health.csvExists && health.csvReadable && health.csvWritable;

    return NextResponse.json(
      {
        success: true,
        status: isHealthy ? "healthy" : "degraded",
        csvExists: health.csvExists,
        csvReadable: health.csvReadable,
        csvWritable: health.csvWritable,
        backupDirExists: health.backupDirExists,
        lockStatus: health.lockStatus,
        lastCheck: new Date().toISOString(),
      },
      {
        status: isHealthy ? 200 : 503,
      }
    );
  } catch (error) {
    console.error("CSV health check API error:", error);
    return NextResponse.json(
      {
        success: false,
        status: "error",
        error: "Health check failed",
        csvExists: false,
        csvReadable: false,
        csvWritable: false,
        lastCheck: new Date().toISOString(),
      },
      { status: 503 }
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
