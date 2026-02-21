
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { PDFDocument } from "pdf-lib";
import { tmpdir } from "os";
import fs from "fs";
import path from "path";

// Dynamic imports for Puppeteer (local vs production)
let puppeteer: any;
let chromium: any;

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  let browser: any = null;
  const tempFiles: string[] = [];

  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No Excel file uploaded" }, { status: 400 });
    }

    const file = files[0];
    if (!file.name.match(/\.(xls|xlsx|ods|csv)$/i)) {
      return NextResponse.json({ error: "Only .xls/.xlsx/.ods/.csv files are supported" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });

    // Detect environment
    const isLocal = process.env.NODE_ENV === "development" || !process.env.NETLIFY;

    // Setup Puppeteer
    if (isLocal) {
      const pkg = await import("puppeteer");
      puppeteer = pkg.default;
      browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
    } else {
      const chrom = await import("@sparticuz/chromium");
      const core = await import("puppeteer-core");
      chromium = chrom.default;
      puppeteer = core.default;
      const executablePath = await chromium.executablePath();
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath,
        headless: chromium.headless,
      });
    }

    const mergedPdf = await PDFDocument.create();
    const page = await browser.newPage();

    // Process each sheet
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      // Skip empty sheets
      if (!worksheet || !worksheet["!ref"]) continue;

      const tableHtml = XLSX.utils.sheet_to_html(worksheet);
      const html = `
        <html>
          <head>
            <style>
              table { border-collapse: collapse; min-width: 100%; font-family: sans-serif; font-size: 12px; margin: auto; }
              th, td { border: 1px solid #ccc; padding: 6px; text-align: left; min-width: 60px; word-break: break-all; }
              th { background-color: #f9f9f9; font-weight: bold; }
              body { margin: 0; padding: 20px; background: white; width: fit-content; min-width: 100%; }
            </style>
          </head>
          <body>${tableHtml}</body>
        </html>`;

      await page.setContent(html, { waitUntil: "networkidle0" });

      // Calculate if we need landscape or custom width
      const dimensions = await page.evaluate(() => {
        const table = document.querySelector("table");
        return {
          width: table ? table.offsetWidth : 800,
          height: table ? table.offsetHeight : 600,
        };
      });

      // Fit to A4 Landscape width (1122px at 96dpi)
      // If table is wider than A4 Landscape, we scale it down or use a wider page
      const isVeryWide = dimensions.width > 1122;

      const pdfBytes = await page.pdf({
        format: isVeryWide ? undefined : "A4",
        width: isVeryWide ? `${dimensions.width + 100}px` : undefined,
        height: isVeryWide ? `${dimensions.height + 100}px` : undefined,
        landscape: true,
        printBackground: true,
        margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" },
        scale: isVeryWide ? 1 : Math.max(0.5, Math.min(1, 1100 / dimensions.width))
      });

      const sheetPdf = await PDFDocument.load(pdfBytes);
      const copiedPages = await mergedPdf.copyPages(sheetPdf, sheetPdf.getPageIndices());
      copiedPages.forEach((p) => mergedPdf.addPage(p));
    }

    const mergedPdfBytes = await mergedPdf.save();
    const baseName = file.name.replace(/\.[^/.]+$/, "");

    return new NextResponse(Buffer.from(mergedPdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${baseName}.pdf"`,
        "Content-Length": mergedPdfBytes.length.toString(),
      },
    });

  } catch (err: any) {
    console.error("❌ Excel→PDF Error:", err);
    return NextResponse.json({ error: `Conversion failed: ${err.message}` }, { status: 500 });
  } finally {
    if (browser) await browser.close();
  }
}
