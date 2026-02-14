import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, PDFName, PDFRawStream, PDFDict, PDFArray, PDFNumber } from "pdf-lib";
import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import os from "os";
import sharp from "sharp";
import { inflate } from "zlib";

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
 * Aggressively compresses a PDF by enumerating and re-compressing ALL image objects in the file.
 * This is the most thorough way to reduce size as it catches images hidden in any part of the PDF structure.
 */
async function aggressiveCompress(inputBuffer: Buffer): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(inputBuffer);
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
        // Re-compress existing JPEG
        compressedData = await sharp(rawData)
          .resize(1000, null, { withoutEnlargement: true })
          .jpeg({ quality: 20, mozjpeg: true })
          .toBuffer();
      }
      else if (filter?.toString() === '/FlateDecode' && width > 0 && height > 0) {
        // Unpack raw pixels from Flate (common in scans)
        try {
          const decompressed = await inflateAsync(rawData);

          let channels = 3;
          if (colorSpace?.toString() === '/DeviceGray') channels = 1;

          // Attempt to wrap as raw pixels. If it fails (e.g. predictor encoding), Sharp will throw and we skip.
          compressedData = await sharp(decompressed, {
            raw: { width, height, channels: channels as 1 | 2 | 3 | 4 }
          })
            .resize(1000, null, { withoutEnlargement: true })
            .jpeg({ quality: 20, mozjpeg: true })
            .toBuffer();
        } catch (e) {
          // Decompression or raw parsing failed, skip this image
          continue;
        }
      }

      if (compressedData && compressedData.length < rawData.length * 0.8) {
        // OVERWRITE the stream content in place
        (object as any).contents = new Uint8Array(compressedData);

        // Update metadata for the new JPEG format
        dict.set(PDFName.of('Filter'), PDFName.of('DCTDecode'));
        dict.set(PDFName.of('ColorSpace'), PDFName.of('DeviceRGB'));
        dict.set(PDFName.of('BitsPerComponent'), PDFNumber.of(8));
        dict.delete(PDFName.of('DecodeParams')); // Remove old compression params

        compressedCount++;
      }
    } catch (err) {
      // Silent skip for complex/proprietary image formats
    }
  }

  console.log(`[Aggressive] Re-compressed ${compressedCount} image objects.`);

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

    const inputBuffer = Buffer.from(await file.arrayBuffer());
    console.log(`[Compress] Start: ${inputBuffer.length} bytes`);

    let outputBuffer = await aggressiveCompress(inputBuffer);

    // Final structural pass with qpdf if available
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

    // Safety: If somehow it got bigger, force original
    if (outputBuffer.length >= inputBuffer.length) {
      console.log("[Compress] No reduction achieved, returning original.");
      outputBuffer = inputBuffer;
    }

    return new NextResponse(outputBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="compressed_${file.name}"`,
        "Content-Length": outputBuffer.length.toString(),
      },
    });

  } catch (error: any) {
    console.error("Compression error:", error);
    return NextResponse.json({ error: "Compression failed" }, { status: 500 });
  }
}
