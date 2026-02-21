import { NextRequest, NextResponse } from "next/server";
import { convertWithLibreOffice } from "@/lib/converter";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0)
      return NextResponse.json({ error: "No PDF uploaded" }, { status: 400 });

    const file = files[0];
    const buffer = Buffer.from(await file.arrayBuffer());
    const baseName = file.name.replace(/\.[^/.]+$/, "");

    // LibreOffice can open PDFs and save as DOCX
    const { buffer: docxBuffer } = await convertWithLibreOffice(buffer, file.name, "docx");

    return new NextResponse(new Uint8Array(docxBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${baseName}.docx"`,
      },
    });
  } catch (err: any) {
    console.error("❌ PDF→Word Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
