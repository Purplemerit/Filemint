import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import { tmpdir } from "os";

const execAsync = promisify(exec);

export const runtime = "nodejs";
export const maxDuration = 120;

// ---------------------------------------------------------------
// Find Calibre's ebook-convert binary (Linux / Mac / Windows)
// ---------------------------------------------------------------
async function findEbookConvert(): Promise<string> {
  const candidates = [
    "ebook-convert",                                    // In PATH
    "/usr/bin/ebook-convert",                           // Ubuntu/Debian APT install
    "/usr/local/bin/ebook-convert",                     // Manual install
    "/opt/calibre/ebook-convert",                       // Portable install
    "C:\\Program Files\\Calibre2\\ebook-convert.exe",  // Windows
  ];

  for (const bin of candidates) {
    try {
      await execAsync(`"${bin}" --version`);
      return bin;
    } catch (err) { }
  }
  throw new Error(
    "Calibre not found. On EC2 run:\n" +
    "sudo apt-get install -y calibre\n" +
    "Then restart PM2: pm2 restart all"
  );
}

// ---------------------------------------------------------------
// Fallback: Professional-grade EPUB builder using epub-gen-memory
// ---------------------------------------------------------------
async function buildEpubFallback(buffer: Buffer, fileName: string): Promise<Buffer> {
  const pdfParse = (await import("pdf-parse")).default;
  const Epub = (await import("epub-gen-memory")).default;

  const pdfData = await pdfParse(buffer);
  const plainText = pdfData.text?.trim();

  if (!plainText) throw new Error("No extractable text found in PDF.");

  const bookTitle = fileName.replace(/\.[^/.]+$/, "");

  // Smarter content processing: split by pages/form-feeds
  const rawChunks = plainText
    .split(/\f+/g)
    .map((t) => t.trim())
    .filter((t) => t.length > 20);

  const chapters: any[] = [];
  rawChunks.forEach((chunk, i) => {
    // Basic paragraph wrapping
    const content = chunk
      .split(/\n{2,}/)
      .map(p => `<p>${p.replace(/\n/g, " ").trim()}</p>`)
      .join("");

    chapters.push({
      title: `Page ${i + 1}`,
      content: content
    });
  });

  if (!chapters.length) throw new Error("Could not extract meaningful content from PDF.");

  // Use epub-gen-memory for professional structure
  const option = {
    title: bookTitle,
    author: "Filemint",
    publisher: "Filemint EPUB Engine",
    content: chapters,
    verbose: false,
    tempDir: tmpdir(),
  };

  const epubBuffer = await Epub(option, chapters);
  return Buffer.from(epubBuffer);
}

// ---------------------------------------------------------------
// Main API Handler
// ---------------------------------------------------------------
export async function POST(req: NextRequest) {
  const tmpId = Date.now().toString();
  const inputPath = path.join(tmpdir(), `pdftoepub_${tmpId}.pdf`);
  const outputPath = path.join(tmpdir(), `pdftoepub_${tmpId}.epub`);

  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0)
      return NextResponse.json({ error: "No PDF uploaded" }, { status: 400 });

    const pdfFile = files[0];
    if (!pdfFile.type.includes("pdf") && !pdfFile.name.toLowerCase().endsWith(".pdf"))
      return NextResponse.json({ error: "Only PDF files are supported." }, { status: 400 });

    const buffer = Buffer.from(await pdfFile.arrayBuffer());
    const baseName = pdfFile.name.replace(/\.[^/.]+$/, "");

    let epubBuffer: Buffer;

    // ── Try Calibre first (best quality) ──────────────────────
    try {
      const ebookConvert = await findEbookConvert();
      fs.writeFileSync(inputPath, buffer);

      const cmd = `"${ebookConvert}" "${inputPath}" "${outputPath}" \
        --title="${baseName}" \
        --language="en" \
        --enable-heuristics \
        --smarten-punctuation \
        --chapter="//*[name()='h1' or name()='h2' or name()='h3' or contains(@class, 'heading')]" \
        --chapter-mark="pagebreak" \
        --page-breaks-before="//*[name()='h1' or name()='h2']" \
        --margin-top=36 \
        --margin-bottom=36 \
        --margin-left=36 \
        --margin-right=36 \
        --base-font-size=12 \
        --font-size-mapping="10,12,14,16,18,20,22,24"`;

      await execAsync(cmd, { timeout: 100000 });

      if (!fs.existsSync(outputPath)) throw new Error("Calibre output not found");
      epubBuffer = fs.readFileSync(outputPath);
      console.log("✅ Calibre conversion succeeded");

    } catch (calibreErr: any) {
      // ── Fallback to JS-based builder ──────────────────────
      console.warn("⚠️ Calibre unavailable, using JS fallback:", calibreErr.message);
      epubBuffer = await buildEpubFallback(buffer, pdfFile.name);
    }

    return new NextResponse(new Uint8Array(epubBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/epub+zip",
        "Content-Disposition": `attachment; filename="${baseName}.epub"`,
      },
    });

  } catch (err: any) {
    console.error("❌ EPUB conversion error:", err.message);
    return NextResponse.json(
      { error: `EPUB conversion failed: ${err.message}` },
      { status: 500 }
    );
  } finally {
    try { fs.unlinkSync(inputPath); } catch (err) { }
    try { fs.unlinkSync(outputPath); } catch (err) { }
  }
}
