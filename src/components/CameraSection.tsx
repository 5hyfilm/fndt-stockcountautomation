// app/api/detect-barcode/route.js
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    console.log("🚀 API route called");

    const formData = await request.formData();
    const imageFile = formData.get("image");

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
    const backendUrl =
      process.env.PYTHON_BACKEND_URL || "http://localhost:8000";
    console.log("🔗 Backend URL:", backendUrl);

    try {
      // สร้าง FormData สำหรับส่งไป Python backend
      const pythonFormData = new FormData();
      pythonFormData.append("file", imageFile);

      console.log("📤 Sending to Python backend...");

      // ส่งไปยัง Python backend
      const pythonResponse = await fetch(`${backendUrl}/scan-file`, {
        method: "POST",
        body: pythonFormData,
        headers: {
          // ไม่ต้องตั้ง Content-Type เพื่อให้ browser ตั้ง boundary อัตโนมัติ
        },
      });

      console.log("📥 Python backend response status:", pythonResponse.status);

      if (!pythonResponse.ok) {
        const errorText = await pythonResponse.text();
        console.log("❌ Python backend error:", errorText);
        throw new Error(
          `Python backend error: ${pythonResponse.status} - ${errorText}`
        );
      }

      const result = await pythonResponse.json();
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
    } catch (backendError) {
      console.error("❌ Backend connection error:", backendError);

      // ถ้าเชื่อมต่อ backend ไม่ได้ ให้ส่ง mock response
      return NextResponse.json({
        success: false,
        error: `ไม่สามารถเชื่อมต่อ backend ได้: ${backendError.message}`,
        detections: [],
        barcodes: [],
        confidence: 0,
        rotation_angle: 0,
        decode_method: "error",
        mock: true,
      });
    }
  } catch (error) {
    console.error("💥 API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: `เกิดข้อผิดพลาดในระบบ: ${error.message}`,
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
    backend_url: process.env.PYTHON_BACKEND_URL || "http://localhost:8000",
  });
}
