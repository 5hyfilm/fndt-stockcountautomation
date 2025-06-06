// app/api/detect-barcode/route.ts
import { NextRequest, NextResponse } from "next/server";

const PYTHON_BACKEND_URL =
  process.env.PYTHON_BACKEND_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image") as File;

    if (!imageFile) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่พบไฟล์รูปภาพ",
        },
        { status: 400 }
      );
    }

    // สร้าง FormData ใหม่เพื่อส่งไปยัง Python backend
    const pythonFormData = new FormData();
    pythonFormData.append("image", imageFile);

    // ส่งไปยัง Python backend
    const pythonResponse = await fetch(
      `${PYTHON_BACKEND_URL}/api/detect-barcode`,
      {
        method: "POST",
        body: pythonFormData,
      }
    );

    if (!pythonResponse.ok) {
      throw new Error(`Python backend error: ${pythonResponse.status}`);
    }

    const result = await pythonResponse.json();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: `เกิดข้อผิดพลาด: ${error.message}`,
      },
      { status: 500 }
    );
  }
}
