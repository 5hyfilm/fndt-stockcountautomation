// app/api/detect-barcode/route.ts
import { NextRequest, NextResponse } from "next/server";

const PYTHON_BACKEND_URL =
  process.env.PYTHON_BACKEND_URL || "http://localhost:8000";

interface PythonBackendResponse {
  success: boolean;
  detections?: any[];
  results?: any[];
  barcodes?: any[];
  confidence?: number;
  rotation_angle?: number;
  decode_method?: string;
  barcodes_found?: number;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 API route called");

    const formData = await request.formData();
    const imageFile = formData.get("image") as File;

    if (!imageFile) {
      console.log("❌ No image file found");
      return NextResponse.json(
        {
          success: false,
          error: "ไม่พบไฟล์รูปภาพ",
        },
        { status: 400 }
      );
    }

    console.log(
      "📁 Image file received:",
      imageFile.name,
      imageFile.size,
      "bytes"
    );

    // ตรวจสอบ backend URL
    const backendUrl = PYTHON_BACKEND_URL;
    console.log("🔗 Backend URL:", backendUrl);

    try {
      // สร้าง FormData สำหรับส่งไป Python backend
      const pythonFormData = new FormData();
      pythonFormData.append("image", imageFile); // เปลี่ยนจาก "file" เป็น "image"

      console.log("📤 Sending to Python backend...");

      // ตรวจสอบว่าใช้ Flask หรือ FastAPI
      // ลองเรียก Flask endpoint ก่อน
      let pythonResponse;
      let endpoint = "/api/detect-barcode"; // Flask endpoint

      try {
        console.log(`🔄 Trying Flask endpoint: ${endpoint}`);
        pythonResponse = await fetch(`${backendUrl}${endpoint}`, {
          method: "POST",
          body: pythonFormData,
        });

        if (!pythonResponse.ok) {
          throw new Error(`Flask backend error: ${pythonResponse.status}`);
        }
      } catch (flaskError) {
        console.log("⚠️ Flask endpoint failed, trying FastAPI...");
        // ถ้า Flask ไม่ได้ ลอง FastAPI
        endpoint = "/scan-file"; // FastAPI endpoint
        pythonFormData.delete("image");
        pythonFormData.append("file", imageFile); // FastAPI ใช้ "file"

        pythonResponse = await fetch(`${backendUrl}${endpoint}`, {
          method: "POST",
          body: pythonFormData,
        });

        if (!pythonResponse.ok) {
          const errorText = await pythonResponse.text();
          console.log("❌ Both backends failed:", errorText);
          throw new Error(`Both backends failed: ${pythonResponse.status}`);
        }
      }

      console.log("📥 Python backend response status:", pythonResponse.status);

      const result: PythonBackendResponse = await pythonResponse.json();
      console.log("✅ Python backend result:", result);

      // แปลงผลลัพธ์ให้ตรงกับ format ที่ frontend ต้องการ
      const response = {
        success: result.success || false,
        detections: result.detections || [],
        barcodes: result.results || result.barcodes || [],
        confidence: result.results?.[0]?.confidence || result.confidence || 0,
        rotation_angle:
          result.results?.[0]?.rotation_angle || result.rotation_angle || 0,
        decode_method:
          result.results?.[0]?.decode_method || result.decode_method || "",
        barcodes_found: result.barcodes_found || 0,
      };

      console.log("📤 Sending response:", response);
      return NextResponse.json(response);
    } catch (backendError: unknown) {
      console.error("❌ Backend connection error:", backendError);

      const errorMessage =
        backendError instanceof Error
          ? backendError.message
          : "Unknown backend error";

      // ส่ง mock response เมื่อไม่สามารถเชื่อมต่อได้
      return NextResponse.json({
        success: false,
        error: `ไม่สามารถเชื่อมต่อ backend ได้: ${errorMessage}`,
        detections: [],
        barcodes: [],
        confidence: 0,
        rotation_angle: 0,
        decode_method: "error",
        mock: true,
      });
    }
  } catch (error: unknown) {
    console.error("💥 API Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        error: `เกิดข้อผิดพลาดในระบบ: ${errorMessage}`,
        detections: [],
        barcodes: [],
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  console.log("📝 API health check");
  return NextResponse.json({
    message: "Barcode Detection API",
    status: "running",
    timestamp: new Date().toISOString(),
    endpoints: {
      POST: "/api/detect-barcode - Upload image for barcode detection",
    },
    backend_url: PYTHON_BACKEND_URL,
  });
}
