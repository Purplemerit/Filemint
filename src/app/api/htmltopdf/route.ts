import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { tmpdir } from "os";

export const runtime = "nodejs"; // 👈 Required for Vercel/AWS

export async function POST(req: NextRequest) {
  let tempPdfPath = "";
  let browser: any = null;

  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const url = formData.get("url") as string;

    if ((!files || files.length === 0) && !url) {
      return NextResponse.json({ error: "No HTML file or URL provided" }, { status: 400 });
    }

    let htmlContent = "";
    let pageUrl = "";

    if (url) {
      pageUrl = url;
    } else {
      const htmlFile = files[0];
      if (!htmlFile.name.endsWith(".html") && !htmlFile.name.endsWith(".htm")) {
        return NextResponse.json({ error: "Only .html files are supported" }, { status: 400 });
      }
      const arrayBuffer = await htmlFile.arrayBuffer();
      htmlContent = new TextDecoder().decode(arrayBuffer);
    }

    tempPdfPath = path.join(tmpdir(), `html-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.pdf`);

    // ✅ Use puppeteer locally, chromium in production
    const isLocal = process.env.NODE_ENV === "development";
    let puppeteer, chromium;

    if (isLocal) {
      const pkg = await import("puppeteer");
      puppeteer = pkg.default;
    } else {
      const core = await import("puppeteer-core");
      const chrom = await import("@sparticuz/chromium");
      puppeteer = core.default;
      chromium = chrom.default;
    }

    // ✅ Launch browser properly
    browser = isLocal
      ? await puppeteer.launch({ headless: true }) // puppeteer includes its own Chromium
      : await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      });

    const page = await browser.newPage();
    if (pageUrl) {
      await page.goto(pageUrl, { waitUntil: "networkidle0" });
    } else {
      await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    }
    await page.pdf({ path: tempPdfPath, format: "A4" });

    const pdfBuffer = await fs.promises.readFile(tempPdfPath);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${(pageUrl ? "converted_url" : (files[0]?.name || "converted")).replace('.html', '').replace('.htm', '')}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Error during HTML → PDF conversion:", error);
    return NextResponse.json({ error: `Conversion failed: ${error.message}` }, { status: 500 });
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.error("Error closing browser:", e);
      }
    }
    if (tempPdfPath && fs.existsSync(tempPdfPath)) {
      await fs.promises.unlink(tempPdfPath);
    }
  }
}
