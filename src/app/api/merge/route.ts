import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export const runtime = "nodejs";

/**
 * Attempts to 'unlock' or 'repair' a restricted PDF by re-printing it via Puppeteer.
 * This is a heavy fallback used only when pdf-lib fails due to encryption or structure.
 */
async function repairPdf(buffer: Buffer): Promise<Buffer> {
  let browser = null;
  try {
    const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_VERSION;

    // Configure chromium based on environment
    const executablePath = isLambda
      ? await chromium.executablePath()
      : (process.platform === 'win32'
        ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' // Common Windows path
        : puppeteer.executablePath());

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: true,
    });

    const page = await browser.newPage();
    const base64Pdf = buffer.toString('base64');
    const dataUrl = `data:application/pdf;base64,${base64Pdf}`;

    // Load PDF in browser (this bypasses many standard restrictions if no user password)
    await page.goto(dataUrl, { waitUntil: "networkidle0", timeout: 30000 });

    // Print to a fresh, unrestricted PDF
    const repairedPdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });

    return Buffer.from(repairedPdf);
  } catch (err) {
    console.error("PDF Repair failed:", err);
    throw err;
  } finally {
    if (browser) await (browser as any).close();
  }
}

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

    const mergedPdf = await PDFDocument.create();
    let totalPages = 0;

    for (const fileItem of files) {
      if (!(fileItem instanceof Blob)) continue;
      const fileName = (fileItem as any).name || "document.pdf";

      try {
        let arrayBuffer = await fileItem.arrayBuffer();
        let buffer = Buffer.from(arrayBuffer);

        let pdf;
        try {
          // Attempt standard load
          pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });

          // Check for XFA (proprietary Adobe forms) which often breaks merging
          try {
            const form = pdf.getForm();
            if ((form as any).getXFA && (form as any).getXFA()) {
              console.warn(`File ${fileName} uses XFA, attempting repair...`);
              throw new Error("XFA detected");
            }
          } catch (e: any) {
            if (e.message === "XFA detected") throw e;
          }
        } catch (loadErr: any) {
          const isSecurityIssue = loadErr.message?.toLowerCase().includes("encrypt") ||
            loadErr.message?.toLowerCase().includes("password") ||
            loadErr.message?.toLowerCase().includes("xfa");

          if (isSecurityIssue) {
            console.warn(`Security block for ${fileName}, attempting repair...`);
            const repairedBuffer = await repairPdf(buffer);
            pdf = await PDFDocument.load(repairedBuffer);
          } else {
            throw loadErr;
          }
        }

        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => {
          mergedPdf.addPage(page);
          totalPages++;
        });
      } catch (err: any) {
        console.error(`Error processing file ${fileName}:`, err);
        return NextResponse.json(
          { error: `"${fileName}": ${err.message}. This usually happens with password-protected, signed, or Adobe XFA PDFs.` },
          { status: 500 }
        );
      }
    }

    if (totalPages === 0) {
      return NextResponse.json({ error: "No valid pages were processed." }, { status: 400 });
    }

    const mergedPdfBytes = await mergedPdf.save();
    return new NextResponse(mergedPdfBytes as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="merged_filemint.pdf"',
      },
    });
  } catch (err: any) {
    console.error("Global merge error:", err);
    return NextResponse.json({ error: `Merge failed: ${err.message}` }, { status: 500 });
  }
}
