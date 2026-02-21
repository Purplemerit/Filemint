import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, PDFName, PDFRawStream, PDFNumber } from "pdf-lib";
import sharp from "sharp";

// -----------------------------------------------------------------------------
// Target Profiles: tuned for safe but effective compression
// -----------------------------------------------------------------------------
const PROFILES = {
  extreme: { quality: 18, maxDim: 900 },
  recommended: { quality: 45, maxDim: 1800 },
  less: { quality: 75, maxDim: 2800 },
} as const;

// -----------------------------------------------------------------------------
// Safe PDF Compressor - Strictly targets JPEGs to prevent white pages
// -----------------------------------------------------------------------------
async function safeCompress(buffer: Buffer, level: "extreme" | "recommended" | "less"): Promise<Buffer> {
  const profile = PROFILES[level];
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const context = pdfDoc.context;

  const indirectObjects = context.enumerateIndirectObjects();
  let optimizedCount = 0;

  for (const [ref, object] of indirectObjects) {
    if (!(object instanceof PDFRawStream)) continue;

    const dict = object.dict;

    // Only target Images
    if (dict.get(PDFName.of("Subtype"))?.toString() !== "/Image") continue;

    // Safety: Skip transparency masks to prevent rendering failures/white pages.
    if (dict.get(PDFName.of("ImageMask"))?.toString() === "true") continue;
    if (dict.has(PDFName.of("SMask")) || dict.has(PDFName.of("Mask"))) continue;

    // Safety: ONLY target DCTDecode (JPEG).
    const filter = dict.get(PDFName.of("Filter"))?.toString();
    if (filter !== "/DCTDecode") continue;

    try {
      const rawBytes = object.getContents();

      // Only process images large enough to matter
      if (rawBytes.length < 5000) continue;

      const inputImg = sharp(Buffer.from(rawBytes));

      const compressed = await inputImg
        .resize({
          width: profile.maxDim,
          height: profile.maxDim,
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({
          quality: profile.quality,
          mozjpeg: true,
          progressive: false,
          optimiseScans: true
        })
        .toBuffer();

      // Only commit if we actually saved space
      if (compressed.length < rawBytes.length * 0.98) {
        // Update the bytes
        (object as any).contents = new Uint8Array(compressed);

        // Update Length dictionary
        dict.set(PDFName.of("Length"), PDFNumber.of(compressed.length));

        // Clean up legacy keys
        dict.delete(PDFName.of("DecodeParms"));
        dict.delete(PDFName.of("DecodeParams"));

        optimizedCount++;
      }
    } catch (e) {
      // Skip if error
    }
  }

  // Save the PDF. 
  // IMPORTANT: For small files, we useObjectStreams: true to pack metadata better.
  const pdfBytes = await pdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
    updateFieldAppearances: false
  });

  const output = Buffer.from(pdfBytes);

  // CRITICAL FINAL CHECK: If the result is larger than the original, return the original
  if (output.length >= buffer.length) {
    console.log(`[Compress] Result (${output.length}) larger than original (${buffer.length}). Returning original.`);
    return buffer;
  }

  console.log(`[Compress] Successfully reduced ${buffer.length} to ${output.length} (${optimizedCount} images)`);
  return output;
}

// -----------------------------------------------------------------------------
// POST Handler
// -----------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const levelStr = formData.get("compressionLevel")?.toString() || "recommended";
    const level = (["extreme", "recommended", "less"].includes(levelStr) ? levelStr : "recommended") as any;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const outputBuffer = await safeCompress(inputBuffer, level);

    const reduction = inputBuffer.length - outputBuffer.length;

    return new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="compressed_${file.name}"`,
        "X-Original-Size": String(inputBuffer.length),
        "X-Compressed-Size": String(outputBuffer.length),
      },
    });
  } catch (error: any) {
    console.error("[Compress] Fatal Error:", error);
    return NextResponse.json(
      { error: "Failed to process PDF." },
      { status: 500 }
    );
  }
}
