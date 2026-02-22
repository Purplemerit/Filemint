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
    "ebook-convert",
    "/usr/bin/ebook-convert",
    "/usr/local/bin/ebook-convert",
    "/opt/calibre/ebook-convert",
    "C:\\Program Files\\Calibre2\\ebook-convert.exe",
  ];

  for (const bin of candidates) {
    try {
      await execAsync(`"${bin}" --version`);
      return bin;
    } catch (err) {}
  }
  throw new Error(
    "Calibre not found. On EC2 run:\n" +
      "sudo apt-get install -y calibre\n" +
      "Then restart PM2: pm2 restart all"
  );
}

// ---------------------------------------------------------------
// Extract structured content from PDF using pdfjs-dist
// Detects headings via font size ratio, groups lines by Y coord
// ---------------------------------------------------------------
async function extractStructuredContent(
  buffer: Buffer
): Promise<{ title: string; content: string }[]> {
  // Use legacy build for Node.js compatibility
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.js" as any);

  // Disable worker in Node environment
  pdfjsLib.GlobalWorkerOptions.workerSrc = "";

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    disableFontFace: true,
    verbosity: 0,
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const chapters: { title: string; content: string }[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent({
      includeMarkedContent: false,
    });

    if (!textContent.items || textContent.items.length === 0) continue;

    // ── Step 1: Build line groups by Y position ──────────────
    // Each item has a transform matrix: [scaleX, skewX, skewY, scaleY, x, y]
    // transform[5] = Y position, transform[3] = font height
    type LineGroup = { y: number; fontSize: number; text: string };
    const lineMap = new Map<number, LineGroup>();

    for (const item of textContent.items as any[]) {
      const str: string = item.str ?? "";
      if (!str.trim()) continue;

      const fontSize = Math.abs(item.transform?.[3] ?? 12);
      // Round Y to nearest 2px to group words on the same line
      const y = Math.round((item.transform?.[5] ?? 0) / 2) * 2;

      if (lineMap.has(y)) {
        const existing = lineMap.get(y)!;
        existing.text += " " + str;
        // Keep the largest font size seen on this line
        existing.fontSize = Math.max(existing.fontSize, fontSize);
      } else {
        lineMap.set(y, { y, fontSize, text: str.trim() });
      }
    }

    // ── Step 2: Sort lines top-to-bottom (PDF Y = 0 at bottom) ──
    const lines = Array.from(lineMap.values()).sort((a, b) => b.y - a.y);

    if (lines.length === 0) continue;

    // ── Step 3: Compute average body font size for this page ──
    const fontSizes = lines.map((l) => l.fontSize);
    const avgFontSize = fontSizes.reduce((s, f) => s + f, 0) / fontSizes.length;
    const maxFontSize = Math.max(...fontSizes);

    // ── Step 4: Classify each line and build HTML ─────────────
    let html = "";
    let paragraphBuffer = "";

    const flushParagraph = () => {
      if (paragraphBuffer.trim()) {
        html += `<p>${paragraphBuffer.trim()}</p>\n`;
        paragraphBuffer = "";
      }
    };

    for (const line of lines) {
      const text = line.text.trim();
      if (!text) continue;

      const ratio = line.fontSize / avgFontSize;

      if (line.fontSize >= maxFontSize * 0.9 && ratio > 1.35) {
        // Largest text on page → H1
        flushParagraph();
        html += `<h1>${escapeHtml(text)}</h1>\n`;
      } else if (ratio > 1.25) {
        // Significantly larger than average → H2
        flushParagraph();
        html += `<h2>${escapeHtml(text)}</h2>\n`;
      } else if (ratio > 1.1) {
        // Slightly larger → H3
        flushParagraph();
        html += `<h3>${escapeHtml(text)}</h3>\n`;
      } else {
        // Body text — accumulate into paragraph
        // Start new paragraph if line looks like a sentence boundary
        const prevEndsWithPeriod = paragraphBuffer.trimEnd().match(/[.!?]$/);
        const currStartsWithCap = /^[A-Z]/.test(text);

        if (paragraphBuffer && prevEndsWithPeriod && currStartsWithCap) {
          flushParagraph();
        }

        paragraphBuffer += (paragraphBuffer ? " " : "") + escapeHtml(text);
      }
    }

    flushParagraph();

    if (!html.trim()) continue;

    // Use first H1/H2 text as chapter title, else fallback to page number
    const headingMatch = html.match(/<h[12][^>]*>(.*?)<\/h[12]>/);
    const chapterTitle = headingMatch
      ? stripHtml(headingMatch[1])
      : `Page ${pageNum}`;

    chapters.push({ title: chapterTitle, content: html });
  }

  return chapters;
}

// ── Helpers ───────────────────────────────────────────────────
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

// ---------------------------------------------------------------
// Fallback: Professional-grade EPUB builder using epub-gen-memory
// ---------------------------------------------------------------
async function buildEpubFallback(
  buffer: Buffer,
  fileName: string
): Promise<Buffer> {
  const Epub = (await import("epub-gen-memory")).default;

  const bookTitle = fileName.replace(/\.[^/.]+$/, "");

  let chapters: { title: string; content: string }[] = [];

  // Try structured pdfjs extraction first
  try {
    chapters = await extractStructuredContent(buffer);
    console.log(`✅ pdfjs extracted ${chapters.length} pages`);
  } catch (pdfErr: any) {
    console.warn("⚠️ pdfjs extraction failed, falling back to pdf-parse:", pdfErr.message);
  }

  // Last-resort: flat pdf-parse extraction
  if (!chapters.length) {
    const pdfParse = (await import("pdf-parse")).default;
    const pdfData = await pdfParse(buffer);
    const plainText = pdfData.text?.trim();

    if (!plainText) throw new Error("No extractable text found in PDF.");

    const rawChunks = plainText
      .split(/\f+/g)
      .map((t: string) => t.trim())
      .filter((t: string) => t.length > 20);

    if (!rawChunks.length) throw new Error("PDF text is empty after parsing.");

    chapters = rawChunks.map((chunk: string, i: number) => {
      const content = chunk
        .split(/\n{2,}/)
        .map((p: string) => `<p>${escapeHtml(p.replace(/\n/g, " ").trim())}</p>`)
        .join("\n");
      return { title: `Page ${i + 1}`, content };
    });
  }

  if (!chapters.length) {
    throw new Error("Could not extract meaningful content from PDF.");
  }

  const epubBuffer = await Epub(
    {
      title: bookTitle,
      author: "Filemint",
      publisher: "Filemint EPUB Engine",
      cover: undefined,
      css: `
        body { font-family: Georgia, serif; line-height: 1.7; margin: 1em 2em; }
        h1 { font-size: 1.8em; margin: 1.5em 0 0.5em; page-break-before: always; }
        h2 { font-size: 1.4em; margin: 1.2em 0 0.4em; }
        h3 { font-size: 1.15em; margin: 1em 0 0.3em; }
        p  { margin: 0.5em 0; text-align: justify; }
      `,
      tocTitle: "Table of Contents",
      content: chapters,
      verbose: false,
      tempDir: tmpdir(),
    },
    chapters
  );

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
    if (
      !pdfFile.type.includes("pdf") &&
      !pdfFile.name.toLowerCase().endsWith(".pdf")
    )
      return NextResponse.json(
        { error: "Only PDF files are supported." },
        { status: 400 }
      );

    const buffer = Buffer.from(await pdfFile.arrayBuffer());
    const baseName = pdfFile.name.replace(/\.[^/.]+$/, "");

    let epubBuffer: Buffer;

    // ── Try Calibre first (best quality) ──────────────────────
    try {
      const ebookConvert = await findEbookConvert();
      fs.writeFileSync(inputPath, buffer);

      const cmd =
        `"${ebookConvert}" "${inputPath}" "${outputPath}" ` +
        `--title="${baseName}" ` +
        `--language="en" ` +
        `--enable-heuristics ` +
        `--smarten-punctuation ` +
        `--chapter="//*[name()='h1' or name()='h2' or name()='h3' or contains(@class, 'heading')]" ` +
        `--chapter-mark="pagebreak" ` +
        `--page-breaks-before="//*[name()='h1' or name()='h2']" ` +
        `--margin-top=36 ` +
        `--margin-bottom=36 ` +
        `--margin-left=36 ` +
        `--margin-right=36 ` +
        `--base-font-size=12 ` +
        `--font-size-mapping="10,12,14,16,18,20,22,24"`;

      await execAsync(cmd, { timeout: 100000 });

      if (!fs.existsSync(outputPath))
        throw new Error("Calibre output not found");

      epubBuffer = fs.readFileSync(outputPath);
      console.log("✅ Calibre conversion succeeded");
    } catch (calibreErr: any) {
      // ── Fallback to JS-based builder ──────────────────────
      console.warn(
        "⚠️ Calibre unavailable, using JS fallback:",
        calibreErr.message
      );
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
    try {
      fs.unlinkSync(inputPath);
    } catch (_) {}
    try {
      fs.unlinkSync(outputPath);
    } catch (_) {}
  }
}