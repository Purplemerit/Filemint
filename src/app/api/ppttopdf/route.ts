import { NextRequest, NextResponse } from "next/server";
import { tmpdir } from "os";
import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";

// Only import dynamically to prevent conflict
let puppeteer: any;
let chromium: any;

export async function POST(req: NextRequest) {
  let tempPdfPath = "";

  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No PowerPoint file uploaded" }, { status: 400 });
    }

    const pptFile = files[0];
    if (!pptFile.name.endsWith(".pptx")) {
      return NextResponse.json({ error: "Only .pptx files are supported" }, { status: 400 });
    }

    const arrayBuffer = await pptFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract slide text using original AdmZip method from GitHub
    const zip = new AdmZip(buffer);
    const slideFiles = zip
      .getEntries()
      .filter(
        (entry) =>
          entry.entryName.startsWith("ppt/slides/slide") &&
          entry.entryName.endsWith(".xml")
      )
      .sort((a, b) => a.entryName.localeCompare(b.entryName, undefined, { numeric: true }));

    const slideContents: string[] = [];
    for (const slide of slideFiles) {
      const xml = slide.getData().toString("utf8");
      const matches = xml.match(/<a:t>([^<]+)<\/a:t>/g);
      if (matches) {
        const text = matches
          .map((m) => m.replace(/<\/?a:t>/g, ""))
          .map(escapeHtml)
          .join(" ");
        slideContents.push(text);
      } else {
        slideContents.push("");
      }
    }

    // "PROPER FORMAT" Presentation Template
    // Restored original logic but with high-fidelity slide styling
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
            
            body { 
              margin: 0; 
              padding: 0; 
              background: #f0f2f5; 
              font-family: 'Inter', sans-serif;
            }

            .slide {
              width: 11in;
              height: 8.5in;
              background: white;
              margin: 20px auto;
              padding: 60px;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: flex-start;
              position: relative;
              box-shadow: 0 10px 30px rgba(0,0,0,0.1);
              page-break-after: always;
              border-radius: 4px;
              overflow: hidden;
            }

            .slide::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 8px;
              background: linear-gradient(90deg, #d9534f, #f0ad4e);
            }

            .slide-number {
              position: absolute;
              bottom: 30px;
              right: 40px;
              color: #999;
              font-size: 14px;
            }

            h2 { 
              font-size: 32px; 
              color: #2c3e50; 
              margin-bottom: 40px;
              border-bottom: 2px solid #eee;
              padding-bottom: 10px;
              font-weight: 700;
            }

            p { 
              font-size: 18px; 
              line-height: 1.6; 
              color: #444; 
              white-space: pre-wrap;
              word-wrap: break-word;
            }

            @page {
              size: 11in 8.5in;
              margin: 0;
            }

            @media print {
              body { background: white; }
              .slide { margin: 0; box-shadow: none; border: none; border-radius: 0; }
            }
          </style>
        </head>
        <body>
          ${slideContents
        .map(
          (text, i) => `
                <div class="slide">
                  <h2>Slide ${i + 1}</h2>
                  <p>${text || "(Empty Slide)"}</p>
                  <div class="slide-number">${i + 1} / ${slideContents.length}</div>
                </div>
              `
        )
        .join("")}
        </body>
      </html>
    `;

    // Determine environment (Restored from GitHub version)
    const isLocal = process.env.NODE_ENV === "development";

    if (isLocal) {
      const pkg = await import("puppeteer");
      puppeteer = pkg.default;
    } else {
      const chrom = await import("@sparticuz/chromium");
      const core = await import("puppeteer-core");
      chromium = chrom.default;
      puppeteer = core.default;
    }

    // Launch browser (Restored from GitHub version)
    const browser = isLocal
      ? await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
      })
      : await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      });

    const page = await browser.newPage();
    await page.setViewport({ width: 1100, height: 850 });
    await page.setContent(html, { waitUntil: "networkidle0" });

    tempPdfPath = path.join(tmpdir(), `ppt-${Date.now()}.pdf`);
    await page.pdf({
      path: tempPdfPath,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      preferCSSPageSize: true
    });

    await browser.close();

    const pdfBuffer = await fs.promises.readFile(tempPdfPath);
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="presentation_converted.pdf"',
      },
    });
  } catch (error: any) {
    console.error("Error during PowerPoint to PDF conversion:", error);
    return NextResponse.json({ error: `Conversion failed: ${error.message}` }, { status: 500 });
  } finally {
    try {
      if (tempPdfPath && fs.existsSync(tempPdfPath)) {
        await fs.promises.unlink(tempPdfPath);
      }
    } catch (cleanupError) {
      console.error("Error cleaning up PDF temp file:", cleanupError);
    }
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
