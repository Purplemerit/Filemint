import { NextRequest, NextResponse } from "next/server";
import { convertWithLibreOffice } from "@/lib/converter";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0)
      return NextResponse.json({ error: "No Excel file uploaded" }, { status: 400 });

    const file = files[0];
    if (!file.name.match(/\.(xls|xlsx|ods|csv)$/i))
      return NextResponse.json({ error: "Only .xls/.xlsx/.ods/.csv files are supported" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const baseName = file.name.replace(/\.[^/.]+$/, "");

    const { buffer: pdfBuffer } = await convertWithLibreOffice(buffer, file.name, "pdf");

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${baseName}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error("❌ Excel→PDF Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
