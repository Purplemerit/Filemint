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

    // Extract slide text
    const zip = new AdmZip(buffer);
    const slideFiles = zip
      .getEntries()
      .filter(
        (entry) =>
          entry.entryName.startsWith("ppt/slides/slide") &&
          entry.entryName.endsWith(".xml")
      )
      .sort((a, b) => a.entryName.localeCompare(b.entryName, undefined, { numeric: true }));

    const slideTitles: string[] = [];
    for (const slide of slideFiles) {
      const xml = slide.getData().toString("utf8");
      const matches = xml.match(/<a:t>([^<]+)<\/a:t>/g);
      if (matches) {
        const text = matches
          .map((m) => m.replace(/<\/?a:t>/g, ""))
          .map(escapeHtml)
          .join(" ");
        slideTitles.push(text);
      } else {
        slideTitles.push("Untitled Slide");
      }
    }

    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 2rem; }
            .slide {
              page-break-after: always;
              border: 2px solid #ccc;
              padding: 2rem;
              margin-bottom: 2rem;
              border-radius: 10px;
              box-shadow: 0 2px 6px rgba(0,0,0,0.1);
            }
            h2 { margin-top: 0; color: #d9534f; }
          </style>
        </head>
        <body>
          ${slideTitles
            .map(
              (title, i) =>
                `<div class="slide"><h2>Slide ${i + 1}</h2><p>${title}</p></div>`
            )
            .join("")}
        </body>
      </html>
    `;

    // Γ£à Determine environment
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

    // Γ£à Launch browser
    const browser = isLocal
      ? await puppeteer.launch({ headless: true }) // full puppeteer includes chromium
      : await puppeteer.launch({
          args: chromium.args,
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath(),
          headless: chromium.headless,
        });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    tempPdfPath = path.join(tmpdir(), `ppt-${Date.now()}.pdf`);
    await page.pdf({ path: tempPdfPath, format: "A4" });
    await browser.close();

    const pdfBuffer = await fs.promises.readFile(tempPdfPath);
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="converted.pdf"',
      },
    });
  } catch (error: any) {
    console.error("Error during PowerPoint to PDF conversion:", error);
    return NextResponse.json({ error: `Conversion failed: ${error.message}` }, { status: 500 });
  } finally {
    if (tempPdfPath && fs.existsSync(tempPdfPath)) {
      await fs.promises.unlink(tempPdfPath);
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
