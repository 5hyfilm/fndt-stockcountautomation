// src/app/api/products/csv/backup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { csvUpdateService } from "../../../../../services/csvUpdateService";

// ===== MAIN HANDLER =====
export async function POST(): Promise<NextResponse> {
  try {
    const result = await csvUpdateService.createBackup();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "CSV backup created successfully",
        data: {
          backupPath: result.backupPath,
          timestamp: result.timestamp,
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to create backup",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("CSV backup API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error during backup creation",
      },
      { status: 500 }
    );
  }
}

// ===== GET METHOD - List Backups =====
export async function GET(): Promise<NextResponse> {
  try {
    // This would list available backups
    // For now, just return success
    return NextResponse.json({
      success: true,
      message: "Backup listing not implemented yet",
      data: {
        availableBackups: [],
        backupDirectory: "/backups/csv",
      },
    });
  } catch (error) {
    console.error("CSV backup list API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to list backups",
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
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
