import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { createCanvas } from "canvas";
import JSZip from "jszip";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No PDF uploaded." }, { status: 400 });
    }

    const pdfFile = files[0];
    const buffer = Buffer.from(await pdfFile.arrayBuffer());

    // Load PDF
    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const totalPages = pdfDoc.getPageCount();

    // Prepare ZIP
    const zip = new JSZip();

    for (let i = 0; i < totalPages; i++) {
      const page = pdfDoc.getPage(i);
      const { width, height } = page.getSize();

      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // Simple background render placeholder
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "black";
      ctx.font = "20px Arial";
      ctx.fillText(`PDF Page ${i + 1}`, 50, 100);

      const imgBuffer = canvas.toBuffer("image/png");
      zip.file(`page-${i + 1}.png`, imgBuffer);
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    return new NextResponse(zipBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="pdf-images.zip"',
      },
    });
  } catch (err: any) {
    console.error("PDF to PNG error:", err);
    return NextResponse.json({ error: err.message || "Conversion failed" }, { status: 500 });
  }
}
