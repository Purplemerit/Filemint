import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files");

    if (!files || files.length < 2) {
      return NextResponse.json(
        { error: "Please upload at least two PDF files to merge." },
        { status: 400 }
      );
    }

    // Create a new empty PDF document
    const mergedPdf = await PDFDocument.create();
    let totalPages = 0;

    for (const fileItem of files) {
      if (!(fileItem instanceof Blob)) continue;

      const fileName = (fileItem as any).name || "unknown.pdf";

      try {
        const arrayBuffer = await fileItem.arrayBuffer();

        // ignoreEncryption: true is CRITICAL for many restricted PDFs
        const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());

        copiedPages.forEach((page) => {
          mergedPdf.addPage(page);
          totalPages++;
        });
      } catch (loadErr: any) {
        console.error(`Error processing file ${fileName}:`, loadErr);
        return NextResponse.json(
          { error: `Error processing "${fileName}": ${loadErr.message || "Invalid PDF structure"}. Try ensuring the file is not corrupted or password-protected.` },
          { status: 500 }
        );
      }
    }

    if (totalPages === 0) {
      return NextResponse.json(
        { error: "No valid PDF pages were found to merge." },
        { status: 400 }
      );
    }

    const mergedPdfBytes = await mergedPdf.save();

    return new NextResponse(mergedPdfBytes as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="merged_filemint.pdf"',
        "Content-Length": mergedPdfBytes.length.toString(),
      },
    });
  } catch (err: any) {
    console.error("Global merge error:", err);
    return NextResponse.json(
      { error: `Merge process failed: ${err.message || "Unknown error"}` },
      { status: 500 }
    );
  }
}
