import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, PDFName, PDFRawStream, PDFDict, PDFArray, PDFNumber } from "pdf-lib";
import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import os from "os";
import sharp from "sharp";
import { inflate } from "zlib";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

const execAsync = promisify(exec);
const inflateAsync = promisify(inflate);

async function hasQpdf(): Promise<boolean> {
  try {
    await execAsync("qpdf --version");
    return true;
  } catch {
    return false;
  }
}

/**
 * Attempts to 'unlock' or 'repair' a restricted PDF by re-printing it via Puppeteer.
 */
async function repairPdf(buffer: Buffer): Promise<Buffer> {
  let browser = null;
  try {
    const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_VERSION;
    const executablePath = isLambda
      ? await chromium.executablePath()
      : (process.platform === 'win32'
        ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
        : puppeteer.executablePath());

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: true,
    });

    const page = await browser.newPage();
    const dataUrl = `data:application/pdf;base64,${buffer.toString('base64')}`;
    await page.goto(dataUrl, { waitUntil: "networkidle0", timeout: 30000 });

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

/**
 * Aggressively compresses a PDF by enumerating and re-compressing ALL image objects in the file.
 */
async function aggressiveCompress(inputBuffer: Buffer): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(inputBuffer, { ignoreEncryption: true });
  const context = pdfDoc.context;
  const indirectObjects = context.enumerateIndirectObjects();

  let compressedCount = 0;

  for (const [ref, object] of indirectObjects) {
    if (!(object instanceof PDFRawStream)) continue;

    const dict = object.dict;
    const subtype = context.lookup(dict.get(PDFName.of('Subtype')));
    if (subtype?.toString() !== '/Image') continue;

    try {
      const width = Number(context.lookup(dict.get(PDFName.of('Width'))));
      const height = Number(context.lookup(dict.get(PDFName.of('Height'))));
      const filter = context.lookup(dict.get(PDFName.of('Filter')));
      const colorSpace = context.lookup(dict.get(PDFName.of('ColorSpace')));

      const rawData = object.getContents();
      if (rawData.length < 5000) continue; // Skip tiny icons

      let compressedData: Buffer | null = null;
      const isDCT = filter?.toString() === '/DCTDecode' ||
        (filter instanceof PDFArray && (filter as any).asArray().map((v: any) => v.toString()).includes('/DCTDecode'));

      if (isDCT) {
        compressedData = await sharp(rawData)
          .resize(1000, null, { withoutEnlargement: true })
          .jpeg({ quality: 20, mozjpeg: true })
          .toBuffer();
      }
      else if (filter?.toString() === '/FlateDecode' && width > 0 && height > 0) {
        try {
          const decompressed = await inflateAsync(rawData);
          let channels = 3;
          if (colorSpace?.toString() === '/DeviceGray') channels = 1;

          compressedData = await sharp(decompressed, {
            raw: { width, height, channels: channels as 1 | 2 | 3 | 4 }
          })
            .resize(1000, null, { withoutEnlargement: true })
            .jpeg({ quality: 20, mozjpeg: true })
            .toBuffer();
        } catch (e) { continue; }
      }

      if (compressedData && compressedData.length < rawData.length * 0.8) {
        (object as any).contents = new Uint8Array(compressedData);
        dict.set(PDFName.of('Filter'), PDFName.of('DCTDecode'));
        dict.set(PDFName.of('ColorSpace'), PDFName.of('DeviceRGB'));
        dict.set(PDFName.of('BitsPerComponent'), PDFNumber.of(8));
        dict.delete(PDFName.of('DecodeParams'));
        compressedCount++;
      }
    } catch (err) { }
  }

  return Buffer.from(await pdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
    updateFieldAppearances: false,
  }));
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file || !file.name) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    let inputBuffer = Buffer.from(await file.arrayBuffer());
    console.log(`[Compress] Start: ${inputBuffer.length} bytes`);

    let outputBuffer;
    try {
      // Diagnostic load to check for XFA before aggressive processing
      const pdf = await PDFDocument.load(inputBuffer, { ignoreEncryption: true });
      try {
        if ((pdf.getForm() as any).getXFA && (pdf.getForm() as any).getXFA()) {
          throw new Error("Adobe XFA forms are not supported for aggressive compression.");
        }
      } catch (e: any) { if (e.message.includes("XFA")) throw e; }

      outputBuffer = await aggressiveCompress(inputBuffer);
    } catch (err: any) {
      console.warn(`Block detected for ${file.name}, attempting repair...`);
      try {
        const repaired = await repairPdf(inputBuffer);
        outputBuffer = await aggressiveCompress(repaired);
      } catch (repairErr: any) {
        return NextResponse.json({
          error: `"${file.name}": ${err.message || "The document is secured with a password or uses an unsupported format"}. Please remove security first.`
        }, { status: 500 });
      }
    }

    const qpdfAvailable = await hasQpdf();
    if (qpdfAvailable && outputBuffer.length < inputBuffer.length) {
      const uploadDir = os.tmpdir();
      const tempIn = path.join(uploadDir, `c-in-${Date.now()}.pdf`);
      const tempOut = path.join(uploadDir, `c-out-${Date.now()}.pdf`);
      await fs.writeFile(tempIn, outputBuffer);
      try {
        await execAsync(`qpdf --compress-streams=y --object-streams=generate "${tempIn}" "${tempOut}"`);
        outputBuffer = await fs.readFile(tempOut);
      } catch { } finally {
        await fs.unlink(tempIn).catch(() => { });
        await fs.unlink(tempOut).catch(() => { });
      }
    }

    if (outputBuffer.length >= inputBuffer.length) {
      outputBuffer = inputBuffer;
    }

    return new NextResponse(outputBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="compressed_${file.name}"`,
      },
    });

  } catch (error: any) {
    console.error("Compression global error:", error);
    return NextResponse.json({
      error: `Compression failed: ${error.message}`
    }, { status: 500 });
  }
}
