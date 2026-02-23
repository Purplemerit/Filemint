import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, PDFName, PDFRawStream, PDFNumber, PDFArray, PDFDict } from "pdf-lib";
import sharp from "sharp";
import { execSync } from "child_process";
import { writeFileSync, readFileSync, unlinkSync, existsSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

// ─────────────────────────────────────────────────────────────────────────────
// PROFILES — each level is meaningfully different
// ─────────────────────────────────────────────────────────────────────────────
const PROFILES = {
  // 🔴 EXTREME: smallest possible file — heavy quality loss
  extreme: {
    jpegQuality: 12,
    maxDim: 800,
    minBytesToCompress: 1000,
    useObjectStreams: true,
    stripMetadata: true,
    convertToGray: true,           // convert color images to grayscale
    gsSettings: "-dPDFSETTINGS=/screen -dColorImageResolution=72 -dGrayImageResolution=72 -dCompatibilityLevel=1.4 -dColorConversionStrategy=/Gray -dProcessColorModel=/DeviceGray",
  },
  // 🟡 RECOMMENDED: best balance of size and quality
  recommended: {
    jpegQuality: 40,
    maxDim: 1600,
    minBytesToCompress: 3000,
    useObjectStreams: true,
    stripMetadata: false,
    convertToGray: false,
    gsSettings: "-dPDFSETTINGS=/ebook -dColorImageResolution=120 -dGrayImageResolution=120 -dCompatibilityLevel=1.5",
  },
  // 🟢 LESS: mild compression — preserve quality
  less: {
    jpegQuality: 75,
    maxDim: 2400,
    minBytesToCompress: 8000,
    useObjectStreams: false,        // keep structure intact
    stripMetadata: false,
    convertToGray: false,
    gsSettings: "-dPDFSETTINGS=/printer -dColorImageResolution=200 -dGrayImageResolution=200 -dCompatibilityLevel=1.6",
  },
} as const;

type Level = keyof typeof PROFILES;

// ─────────────────────────────────────────────────────────────────────────────
// GHOSTSCRIPT (most powerful — compresses everything including text/fonts)
// ─────────────────────────────────────────────────────────────────────────────
function ghostscriptAvailable(): boolean {
  try { execSync("gs --version", { stdio: "pipe" }); return true; } catch {}
  try { execSync("gswin64c --version", { stdio: "pipe" }); return true; } catch {}
  return false;
}

function compressWithGS(buffer: Buffer, level: Level): Buffer | null {
  const profile = PROFILES[level];
  const input  = join(tmpdir(), `gs_in_${Date.now()}.pdf`);
  const output = join(tmpdir(), `gs_out_${Date.now()}.pdf`);

  try {
    writeFileSync(input, buffer);

    const gsCmd = (() => {
      try { execSync("gs --version", { stdio: "pipe" }); return "gs"; } catch {}
      return "gswin64c";
    })();

    const cmd = [
      gsCmd,
      "-sDEVICE=pdfwrite",
      "-dNOPAUSE", "-dBATCH", "-dQUIET",
      profile.gsSettings,
      "-dDownsampleColorImages=true",
      "-dDownsampleGrayImages=true",
      "-dDownsampleMonoImages=true",
      "-dColorImageDownsampleType=/Bicubic",
      "-dGrayImageDownsampleType=/Bicubic",
      "-dAutoFilterColorImages=false",
      "-dAutoFilterGrayImages=false",
      "-dColorImageFilter=/DCTEncode",
      "-dGrayImageFilter=/DCTEncode",
      `-dJPEGQ=${profile.jpegQuality}`,
      "-dCompressFonts=true",
      "-dSubsetFonts=true",
      "-dDetectDuplicateImages=true",
      `-sOutputFile=${output}`,
      input,
    ].join(" ");

    execSync(cmd, { timeout: 120_000, stdio: "pipe" });

    if (!existsSync(output)) return null;
    return Buffer.from(readFileSync(output));
  } catch (e) {
    console.error("[GS] Error:", e);
    return null;
  } finally {
    try { unlinkSync(input); } catch {}
    try { unlinkSync(output); } catch {}
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF-LIB FALLBACK — recompress images + strip metadata for extreme
// ─────────────────────────────────────────────────────────────────────────────

// All filter types that wrap image data sharp can attempt to decode
const IMAGE_FILTERS = new Set([
  "/DCTDecode",        // JPEG
  "/FlateDecode",      // PNG / deflate
  "/LZWDecode",        // LZW
  "/JPXDecode",        // JPEG 2000
  "/CCITTFaxDecode",   // fax mono
  "/JBIG2Decode",      // JBIG2
  "/RunLengthDecode",
]);

async function compressWithPdfLib(buffer: Buffer, level: Level): Promise<Buffer> {
  const profile = PROFILES[level];
  const pdfDoc  = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const context = pdfDoc.context;

  let imgCount = 0;

  for (const [, obj] of context.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFRawStream)) continue;

    const dict = obj.dict;
    if (dict.get(PDFName.of("Subtype"))?.toString() !== "/Image") continue;
    if (dict.get(PDFName.of("ImageMask"))?.toString() === "true") continue;
    if (dict.has(PDFName.of("SMask"))) continue;

    // Determine filter
    const filterObj = dict.get(PDFName.of("Filter"));
    let filterStr = filterObj?.toString() ?? "";
    if (filterObj instanceof PDFArray) filterStr = filterObj.get(0)?.toString() ?? "";
    if (!IMAGE_FILTERS.has(filterStr)) continue;

    const raw = obj.getContents();
    if (raw.length < profile.minBytesToCompress) continue;

    try {
      let img = sharp(Buffer.from(raw));

      // 🔴 EXTREME: convert to grayscale to shrink further
      if (profile.convertToGray) img = img.grayscale();

      // Resize only if needed
      img = img.resize({
        width: profile.maxDim,
        height: profile.maxDim,
        fit: "inside",
        withoutEnlargement: true,
      });

      const compressed = await img
        .jpeg({ quality: profile.jpegQuality, mozjpeg: true })
        .toBuffer();

      if (compressed.length >= raw.length * 0.97) continue; // skip if no real gain

      (obj as any).contents = new Uint8Array(compressed);
      dict.set(PDFName.of("Length"), PDFNumber.of(compressed.length));
      dict.set(PDFName.of("Filter"), PDFName.of("DCTDecode"));
      dict.delete(PDFName.of("DecodeParms"));
      dict.delete(PDFName.of("DecodeParams"));

      // Update colorspace for grayscale conversion
      if (profile.convertToGray) {
        dict.set(PDFName.of("ColorSpace"), PDFName.of("DeviceGray"));
        dict.set(PDFName.of("BitsPerComponent"), PDFNumber.of(8));
      }

      imgCount++;
    } catch {
      // Sharp couldn't decode this stream — skip safely
    }
  }

  // 🔴 EXTREME extra: strip XMP / Info metadata to shave more bytes
  if (profile.stripMetadata) {
    try {
      const catalog = pdfDoc.catalog;
      catalog.delete(PDFName.of("Metadata"));
      const infoRef = (pdfDoc.context as any).trailerInfo?.Info;
      if (infoRef) {
        const infoDict = pdfDoc.context.lookup(infoRef);
        if (infoDict instanceof PDFDict) {
          for (const key of infoDict.keys()) infoDict.delete(key);
        }
      }
    } catch {}
  }

  const saved = await pdfDoc.save({
    useObjectStreams: profile.useObjectStreams,
    addDefaultPage: false,
    updateFieldAppearances: false,
  });

  console.log(`[pdf-lib] level=${level} images=${imgCount} ${buffer.length}→${saved.length}`);
  return Buffer.from(saved);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPRESS — GS first, pdf-lib fallback, always return the smallest result
// ─────────────────────────────────────────────────────────────────────────────
async function compress(buffer: Buffer, level: Level): Promise<Buffer> {
  let best = buffer;

  // ① Try Ghostscript — handles fonts, content streams, everything
  if (ghostscriptAvailable()) {
    const gs = compressWithGS(buffer, level);
    if (gs && gs.length < best.length) {
      console.log(`[GS] ✓ saved ${Math.round((1 - gs.length / buffer.length) * 100)}%`);
      best = gs;
    }
  }

  // ② Always also run pdf-lib on the ORIGINAL buffer
  //    (independently, so both have a shot at winning)
  const pdflib = await compressWithPdfLib(buffer, level);
  if (pdflib.length < best.length) {
    console.log(`[pdf-lib] ✓ saved ${Math.round((1 - pdflib.length / buffer.length) * 100)}%`);
    best = pdflib;
  }

  if (best === buffer) {
    console.log(`[Compress] No reduction at level=${level} — returning original`);
  } else {
    console.log(`[Compress] Final: ${buffer.length}→${best.length} (${Math.round((1 - best.length / buffer.length) * 100)}%) level=${level}`);
  }

  return best;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST handler
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file     = formData.get("file") as File | null;
    const levelRaw = formData.get("compressionLevel")?.toString() ?? "recommended";
    const level    = (["extreme", "recommended", "less"].includes(levelRaw)
      ? levelRaw : "recommended") as Level;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const input  = Buffer.from(await file.arrayBuffer());
    const output = await compress(input, level);

    return new NextResponse(output, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="compressed_${file.name}"`,
        "X-Original-Size":   String(input.length),
        "X-Compressed-Size": String(output.length),
      },
    });
  } catch (err: any) {
    console.error("[POST] Fatal:", err);
    return NextResponse.json({ error: "Failed to process PDF." }, { status: 500 });
  }
}