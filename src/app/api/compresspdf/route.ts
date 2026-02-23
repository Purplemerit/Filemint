import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, PDFName, PDFRawStream, PDFNumber, PDFArray, PDFDict } from "pdf-lib";
import sharp from "sharp";
import { execSync, spawnSync } from "child_process";
import { writeFileSync, readFileSync, unlinkSync, existsSync, mkdirSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const MAX_FILE_SIZE_MB = 100;
const TMP_DIR = join(tmpdir(), "filemint_compress");
try { mkdirSync(TMP_DIR, { recursive: true }); } catch {}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILES — three genuinely distinct levels
// ─────────────────────────────────────────────────────────────────────────────
const PROFILES = {
  /**
   * 🔴 EXTREME  →  Target 60–85% reduction
   * Grayscale images, 72 DPI, quality 12, strip metadata
   */
  extreme: {
    jpegQuality:        12,
    maxDim:             800,
    minBytesToProcess:  500,
    convertToGray:      true,
    useObjectStreams:    true,
    stripMetadata:      true,
    gsPdfSettings:      "/screen",
    gsColorDPI:         72,
    gsGrayDPI:          72,
    gsMonoDPI:          72,
    gsCompatibility:    "1.4",
    gsConvertToGray:    true,
  },
  /**
   * 🟡 RECOMMENDED  →  Target 30–60% reduction
   * Colour preserved, 120 DPI, quality 38
   */
  recommended: {
    jpegQuality:        38,
    maxDim:             1600,
    minBytesToProcess:  2000,
    convertToGray:      false,
    useObjectStreams:    true,
    stripMetadata:      false,
    gsPdfSettings:      "/ebook",
    gsColorDPI:         120,
    gsGrayDPI:          120,
    gsMonoDPI:          150,
    gsCompatibility:    "1.5",
    gsConvertToGray:    false,
  },
  /**
   * 🟢 LESS  →  Target 10–25% reduction
   * Near-original quality, 180 DPI, quality 75
   */
  less: {
    jpegQuality:        75,
    maxDim:             2400,
    minBytesToProcess:  10_000,
    convertToGray:      false,
    useObjectStreams:    false,
    stripMetadata:      false,
    gsPdfSettings:      "/printer",
    gsColorDPI:         180,
    gsGrayDPI:          180,
    gsMonoDPI:          300,
    gsCompatibility:    "1.6",
    gsConvertToGray:    false,
  },
} as const;

type Level = keyof typeof PROFILES;

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const tmpFile = (ext = "pdf") => join(TMP_DIR, `${randomUUID()}.${ext}`);

function safeUnlink(...paths: string[]) {
  for (const p of paths) {
    try { if (existsSync(p)) unlinkSync(p); } catch {}
  }
}

const fmtMB = (b: number) => `${(b / 1_048_576).toFixed(2)} MB`;
const pctSaved = (orig: number, out: number) => `${Math.round((1 - out / orig) * 100)}%`;

// ─────────────────────────────────────────────────────────────────────────────
// ENGINE 1 — GHOSTSCRIPT
// Compresses EVERYTHING: images, fonts, content streams, metadata.
// This is what professional tools (Adobe Acrobat, SmallPDF) use internally.
// ─────────────────────────────────────────────────────────────────────────────
let _gsPath: string | null | undefined;

function getGsPath(): string | null {
  if (_gsPath !== undefined) return _gsPath;
  for (const cmd of ["gs", "gswin64c", "gswin32c"]) {
    try {
      execSync(`${cmd} --version`, { stdio: "pipe" });
      _gsPath = cmd;
      console.log(`[GS] Found at: ${cmd} v${execSync(`${cmd} --version`).toString().trim()}`);
      return _gsPath;
    } catch {}
  }
  _gsPath = null;
  console.warn("[GS] Not found — falling back to pdf-lib only");
  return null;
}

function compressWithGhostscript(buffer: Buffer, level: Level): Buffer | null {
  const gs = getGsPath();
  if (!gs) return null;

  const p   = PROFILES[level];
  const inp = tmpFile();
  const out = tmpFile();

  try {
    writeFileSync(inp, buffer);

    const args: string[] = [
      "-sDEVICE=pdfwrite",
      "-dNOPAUSE",
      "-dBATCH",
      "-dQUIET",
      // Core quality profile
      `-dPDFSETTINGS=${p.gsPdfSettings}`,
      `-dCompatibilityLevel=${p.gsCompatibility}`,
      // Downsample images
      "-dDownsampleColorImages=true",
      "-dDownsampleGrayImages=true",
      "-dDownsampleMonoImages=true",
      "-dColorImageDownsampleType=/Bicubic",
      "-dGrayImageDownsampleType=/Bicubic",
      "-dMonoImageDownsampleType=/Bicubic",
      `-dColorImageResolution=${p.gsColorDPI}`,
      `-dGrayImageResolution=${p.gsGrayDPI}`,
      `-dMonoImageResolution=${p.gsMonoDPI}`,
      // Force JPEG encoding
      "-dAutoFilterColorImages=false",
      "-dAutoFilterGrayImages=false",
      "-dColorImageFilter=/DCTEncode",
      "-dGrayImageFilter=/DCTEncode",
      `-dJPEGQ=${p.jpegQuality}`,
      // Font & stream compression
      "-dCompressFonts=true",
      "-dSubsetFonts=true",
      "-dCompressPages=true",
      "-dDetectDuplicateImages=true",
      `-sOutputFile=${out}`,
      inp,
    ];

    // 🔴 EXTREME only: convert everything to grayscale
    if (p.gsConvertToGray) {
      args.splice(args.length - 2, 0,
        "-dColorConversionStrategy=/Gray",
        "-dProcessColorModel=/DeviceGray"
      );
    }

    const result = spawnSync(gs, args, {
      timeout:   120_000,
      maxBuffer: MAX_FILE_SIZE_MB * 1_048_576 * 2,
    });

    if (result.status !== 0) {
      console.error("[GS] Failed:", result.stderr?.toString().slice(0, 300));
      return null;
    }

    if (!existsSync(out)) return null;

    const output = Buffer.from(readFileSync(out));
    console.log(`[GS] ✓ ${fmtMB(buffer.length)} → ${fmtMB(output.length)} (saved ${pctSaved(buffer.length, output.length)}) level=${level}`);
    return output;

  } catch (err: any) {
    console.error("[GS] Exception:", err?.message);
    return null;
  } finally {
    safeUnlink(inp, out);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ENGINE 2 — PDF-LIB + SHARP
// Handles all image filter types (the old code only handled JPEG!).
// Runs independently so both engines compete — best result wins.
// ─────────────────────────────────────────────────────────────────────────────
const RECOMPRESSABLE_FILTERS = new Set([
  "/DCTDecode",       // JPEG         ← old code only handled THIS ONE
  "/FlateDecode",     // PNG / deflate
  "/LZWDecode",       // LZW
  "/JPXDecode",       // JPEG 2000
  "/CCITTFaxDecode",  // Fax / scanned
  "/JBIG2Decode",     // JBIG2
  "/RunLengthDecode",
]);

async function compressWithPdfLib(buffer: Buffer, level: Level): Promise<Buffer> {
  const p      = PROFILES[level];
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const ctx    = pdfDoc.context;
  let imgCount = 0;

  for (const [, obj] of ctx.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFRawStream)) continue;

    const dict = obj.dict;

    // Must be an image
    if (dict.get(PDFName.of("Subtype"))?.toString() !== "/Image") continue;

    // SAFETY: skip transparency masks — touching these causes blank white pages
    if (dict.get(PDFName.of("ImageMask"))?.toString() === "true") continue;
    if (dict.has(PDFName.of("SMask"))) continue;
    if (dict.has(PDFName.of("Mask")))  continue;

    // Get filter
    const filterObj = dict.get(PDFName.of("Filter"));
    let filterStr   = filterObj?.toString() ?? "";
    if (filterObj instanceof PDFArray) filterStr = filterObj.get(0)?.toString() ?? "";
    if (!RECOMPRESSABLE_FILTERS.has(filterStr)) continue;

    const raw = obj.getContents();
    if (raw.length < p.minBytesToProcess) continue;

    try {
      let img = sharp(Buffer.from(raw));

      // 🔴 EXTREME: force grayscale
      if (p.convertToGray) img = img.grayscale();

      // Resize if larger than target
      img = img.resize({
        width:  p.maxDim,
        height: p.maxDim,
        fit:    "inside",
        withoutEnlargement: true,
      });

      const compressed = await img
        .jpeg({ quality: p.jpegQuality, mozjpeg: true, progressive: false })
        .toBuffer();

      // Only worth committing if we saved at least 3%
      if (compressed.length >= raw.length * 0.97) continue;

      (obj as any).contents = new Uint8Array(compressed);
      dict.set(PDFName.of("Length"), PDFNumber.of(compressed.length));
      dict.set(PDFName.of("Filter"), PDFName.of("DCTDecode"));
      dict.delete(PDFName.of("DecodeParms"));
      dict.delete(PDFName.of("DecodeParams"));

      if (p.convertToGray) {
        dict.set(PDFName.of("ColorSpace"),       PDFName.of("DeviceGray"));
        dict.set(PDFName.of("BitsPerComponent"), PDFNumber.of(8));
      }

      imgCount++;
    } catch {
      // Sharp can't decode this image stream — skip safely
    }
  }

  // 🔴 EXTREME: strip all document metadata for extra savings
  if (p.stripMetadata) {
    try {
      pdfDoc.catalog.delete(PDFName.of("Metadata"));
      const trailerInfo = (ctx as any).trailerInfo;
      if (trailerInfo?.Info) {
        const infoObj = ctx.lookup(trailerInfo.Info);
        if (infoObj instanceof PDFDict) {
          for (const key of infoObj.keys()) infoObj.delete(key);
        }
      }
    } catch {}
  }

  const saved = await pdfDoc.save({
    useObjectStreams:       p.useObjectStreams,
    addDefaultPage:         false,
    updateFieldAppearances: false,
  });

  const out = Buffer.from(saved);
  console.log(`[pdf-lib] ✓ images=${imgCount} ${fmtMB(buffer.length)} → ${fmtMB(out.length)} (saved ${pctSaved(buffer.length, out.length)}) level=${level}`);
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// ORCHESTRATOR — run both engines on the original, return the smallest result
// ─────────────────────────────────────────────────────────────────────────────
async function compress(buffer: Buffer, level: Level): Promise<Buffer> {
  let best = buffer;

  // Run both engines in parallel for speed
  const [gsResult, pdflibResult] = await Promise.all([
    Promise.resolve(compressWithGhostscript(buffer, level)),
    compressWithPdfLib(buffer, level),
  ]);

  if (gsResult     && gsResult.length     < best.length) best = gsResult;
  if (pdflibResult && pdflibResult.length < best.length) best = pdflibResult;

  if (best === buffer) {
    console.log(`[Compress] ⚠️  No reduction for level=${level} (PDF may already be optimised)`);
  } else {
    const winner = best === gsResult ? "ghostscript" : "pdf-lib";
    console.log(`[Compress] ✅ ${winner} won | ${fmtMB(buffer.length)} → ${fmtMB(best.length)} | saved ${pctSaved(buffer.length, best.length)} | level=${level}`);
  }

  return best;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/compresspdf
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const t0 = Date.now();

  try {
    const formData = await req.formData();
    const file     = formData.get("file") as File | null;
    const levelRaw = formData.get("compressionLevel")?.toString() ?? "recommended";
    const level    = (["extreme", "recommended", "less"].includes(levelRaw)
      ? levelRaw : "recommended") as Level;

    // ── Validation ───────────────────────────────────────────────
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE_MB * 1_048_576) {
      return NextResponse.json({ error: `File exceeds ${MAX_FILE_SIZE_MB} MB limit` }, { status: 413 });
    }
    if (file.size < 100) {
      return NextResponse.json({ error: "File appears to be empty or corrupt" }, { status: 400 });
    }

    const input  = Buffer.from(await file.arrayBuffer());
    const output = await compress(input, level);
    const ms     = Date.now() - t0;

    console.log(`[POST] Completed in ${ms}ms`);

    return new NextResponse(output, {
      status: 200,
      headers: {
        "Content-Type":         "application/pdf",
        "Content-Disposition":  `attachment; filename="compressed_${file.name}"`,
        "X-Original-Size":      String(input.length),
        "X-Compressed-Size":    String(output.length),
        "X-Processing-Time-Ms": String(ms),
        "Cache-Control":        "no-store",
      },
    });

  } catch (err: any) {
    console.error(`[POST] Fatal (${Date.now() - t0}ms):`, err?.message ?? err);
    return NextResponse.json(
      { error: "Compression failed. Please try again or use a different file." },
      { status: 500 }
    );
  }
}