import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { tmpdir } from "os";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let tempDocxPath = "";

  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const docxFile = files[0];
    const buffer = Buffer.from(await docxFile.arrayBuffer());
    tempDocxPath = path.join(tmpdir(), `input-${Date.now()}.docx`);
    await fs.promises.writeFile(tempDocxPath, buffer);

    const docxBase64 = buffer.toString("base64");

    // "ULTRA-FIDELITY" TEMPLATE
    // Focused on preventing line overlap by fixing font metrics and layout synchronization
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/docx-preview@0.3.2/dist/docx-preview.js"></script>
        <style>
          /* 1. Metric-Perfect Font Mapping */
          @font-face { font-family: 'Calibri'; src: local('Calibri'), local('Carlito'), local('Open Sans'), sans-serif; }
          @font-face { font-family: 'Cambria'; src: local('Cambria'), local('Caladea'), local('Lora'), serif; }
          @font-face { font-family: 'Arial'; src: local('Arial'), local('Arimo'), sans-serif; }
          @font-face { font-family: 'Times New Roman'; src: local('Times New Roman'), local('Tinos'), serif; }

          html, body { 
            margin: 0; 
            padding: 0; 
            background: white; 
            -webkit-print-color-adjust: exact;
            /* Prevents the browser from 'averaging' letter widths which causes overlap */
            text-rendering: geometricPrecision;
            -webkit-font-smoothing: initial;
          }

          /* 2. Zero-Shift Container */
          .docx-wrapper { 
            background: transparent !important; 
            padding: 0 !important; 
            margin: 0 !important;
            display: block !important;
          }
          
          .docx-wrapper > section.docx {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            /* DO NOT override padding - it represents the Word margins */
            display: block !important;
            page-break-after: always !important;
            position: relative !important;
            overflow: visible !important;
          }

          /* Force precise line-height to prevent vertical overlapping */
          p, span, div {
            line-height: 1.15; /* Word default fallback */
          }

          @page {
            margin: 0;
            size: auto;
          }
          * { box-sizing: border-box; }
        </style>
      </head>
      <body>
        <div id="container"></div>
        <script>
          async function renderUltraFidelity() {
            try {
              const base64 = "${docxBase64}";
              const binaryString = atob(base64);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const container = document.getElementById("container");
              
              // HIGH-ACCURACY RENDER
              await docx.renderAsync(bytes, container, null, {
                ignoreWidth: false,
                ignoreHeight: false,
                ignoreLastRenderedPageBreak: false,
                experimental: true,
                useBase64URL: true,
                trimXmlDeclaration: true,
                renderHeaders: true,
                renderFooters: true,
                renderEmptyPargraphs: true,
                breakPages: true
              });
              
              // Wait for every glyph to load its physical width
              await document.fonts.ready;
              
              // Final check for image/layout stability
              setTimeout(() => {
                window.conversionReady = true;
              }, 1000);
            } catch (err) {
              window.conversionError = err.message;
            }
          }
          renderUltraFidelity();
        </script>
      </body>
      </html>
    `;

    const isLocal = process.env.NODE_ENV === "development";

    const browser = await puppeteer.launch(
      isLocal
        ? {
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-font-subpixel-positioning",
            "--font-render-hinting=none"
          ],
          executablePath:
            process.platform === "win32"
              ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
              : "/usr/bin/google-chrome",
        }
        : {
          args: [
            ...chromium.args,
            "--disable-font-subpixel-positioning",
            "--font-render-hinting=none"
          ],
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath(),
          headless: chromium.headless,
        }
    );

    const page = await browser.newPage();
    // Use high DPI to prevent rounding errors that cause overlaps
    await page.setViewport({ width: 800, height: 1200, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: "networkidle0" });

    await page.waitForFunction('window.conversionReady === true || window.conversionError', { timeout: 60000 });

    const renderError = await page.evaluate(() => (window as any).conversionError);
    if (renderError) throw new Error("Core Conversion Error: " + renderError);

    const pdfBuffer = await page.pdf({
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      preferCSSPageSize: true, // This locks the PDF to the Word doc's internal size
      scale: 1,
      displayHeaderFooter: false
    });

    await browser.close();

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="converted_fidelity.pdf"',
      },
    });
  } catch (err: any) {
    console.error("❌ Conversion Error:", err);
    return NextResponse.json(
      { error: `High-fidelity conversion failed: ${err.message}` },
      { status: 500 }
    );
  } finally {
    if (tempDocxPath && fs.existsSync(tempDocxPath)) {
      try { await fs.promises.unlink(tempDocxPath); } catch (e) { }
    }
  }
}
