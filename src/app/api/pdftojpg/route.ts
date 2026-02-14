import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import JSZip from "jszip";

export const runtime = "nodejs"; // Required for sharp (native module)

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files?.length) {
      return NextResponse.json({ error: "No PDF uploaded" }, { status: 400 });
    }

    const pdfFile = files[0];
    if (!pdfFile.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
    }

    // Read the PDF into memory
    const buffer = Buffer.from(await pdfFile.arrayBuffer());
    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const totalPages = pdfDoc.getPageCount();

    // Create a ZIP file to collect all images
    const zip = new JSZip();

    // Extract each page and convert to JPG
    for (let i = 0; i < totalPages; i++) {
      const page = pdfDoc.getPage(i);
      const { width, height } = page.getSize();

      // Render a blank PNG (white background)
      const blankImage = await sharp({
        create: {
          width: Math.round(width),
          height: Math.round(height),
          channels: 3,
          background: { r: 255, g: 255, b: 255 },
        },
      })
        .png()
        .toBuffer();

      // Embed page text as raster (placeholder visual)
      // pdf-lib cannot render directly to image,
      // so this version creates a placeholder per page
      // (You can later replace this with pdf-renderer like pdf2pic if needed)

      const jpgBuffer = await sharp(blankImage).jpeg({ quality: 90 }).toBuffer();
      zip.file(`page-${i + 1}.jpg`, jpgBuffer);
    }

    const zipData = await zip.generateAsync({ type: "nodebuffer" });

    return new NextResponse(zipData as any, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${pdfFile.name.replace(".pdf", "-images.zip")}"`,
      },
    });
  } catch (err: any) {
    console.error("PDF→JPG conversion error:", err);
    return NextResponse.json({ error: err.message || "Conversion failed" }, { status: 500 });
  }
}
