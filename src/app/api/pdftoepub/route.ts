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
// Fallback: Pure-JS EPUB builder using pdf-parse + JSZip
// (used when Calibre is not installed)
// ---------------------------------------------------------------
async function buildEpubFallback(buffer: Buffer, fileName: string): Promise<Buffer> {
  const pdfParse = (await import("pdf-parse")).default;
  const JSZip = (await import("jszip")).default;

  const pdfData = await pdfParse(buffer);
  const plainText = pdfData.text?.trim();

  if (!plainText) throw new Error("No extractable text found in PDF.");

  const bookTitle = fileName.replace(/\.[^/.]+$/, "");

  // Smarter chapter detection: split on form-feeds OR 3+ blank lines
  const rawChunks = plainText
    .split(/\f+|\n{3,}/g)
    .map((t) => t.trim())
    .filter((t) => t.length > 40);

  // Group small chunks into larger "chapters" (~1500 chars each)
  const chapters: { title: string; html: string }[] = [];
  let buf = "";
  let chapNum = 1;

  for (const chunk of rawChunks) {
    buf += "\n\n" + chunk;
    if (buf.length >= 1500) {
      const paragraphs = buf
        .trim()
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => `<p>${line}</p>`)
        .join("\n");

      chapters.push({
        title: `Chapter ${chapNum}`,
        html: `<h2>Chapter ${chapNum}</h2>\n${paragraphs}`,
      });
      buf = "";
      chapNum++;
    }
  }

  // Push remaining
  if (buf.trim().length > 0) {
    const paragraphs = buf
      .trim()
      .split(/\n+/)
      .map((l) => `<p>${l.trim()}</p>`)
      .filter((p) => p !== "<p></p>")
      .join("\n");
    chapters.push({ title: `Chapter ${chapNum}`, html: `<h2>Chapter ${chapNum}</h2>\n${paragraphs}` });
  }

  if (!chapters.length) throw new Error("Could not extract meaningful content from PDF.");

  const uid = `urn:uuid:${Math.random().toString(36).substring(2)}-${Date.now()}`;

  const css = `
    body { font-family: Georgia, serif; font-size: 1em; line-height: 1.7; margin: 2em; color: #222; }
    h2   { font-size: 1.4em; color: #1a1a1a; margin-top: 2em; border-bottom: 1px solid #ccc; padding-bottom: 0.3em; }
    p    { margin: 0.8em 0; text-indent: 1.2em; }
  `;

  const zip = new JSZip();

  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

  zip.file("META-INF/container.xml",
    `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`);

  zip.file("OEBPS/style.css", css);

  chapters.forEach((ch, i) => {
    zip.file(`OEBPS/chapter${i + 1}.xhtml`,
      `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${ch.title}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  ${ch.html}
</body>
</html>`);
  });

  const manifestItems = [
    `<item id="style" href="style.css" media-type="text/css"/>`,
    ...chapters.map((_, i) =>
      `<item id="chap${i + 1}" href="chapter${i + 1}.xhtml" media-type="application/xhtml+xml"/>`
    ),
  ].join("\n    ");

  const spineItems = chapters.map((_, i) => `<itemref idref="chap${i + 1}"/>`).join("\n    ");

  zip.file("OEBPS/content.opf",
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${bookTitle}</dc:title>
    <dc:language>en</dc:language>
    <dc:identifier id="BookId">${uid}</dc:identifier>
    <meta property="dcterms:modified">${new Date().toISOString().split('.')[0]}Z</meta>
  </metadata>
  <manifest>
    ${manifestItems}
  </manifest>
  <spine>
    ${spineItems}
  </spine>
</package>`);

  const ncxNavPoints = chapters.map((ch, i) =>
    `<navPoint id="navPoint-${i + 1}" playOrder="${i + 1}">
      <navLabel><text>${ch.title}</text></navLabel>
      <content src="chapter${i + 1}.xhtml"/>
    </navPoint>`
  ).join("\n");

  zip.file("OEBPS/toc.ncx",
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN"
 "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd">
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head><meta name="dtb:uid" content="${uid}"/></head>
  <docTitle><text>${bookTitle}</text></docTitle>
  <navMap>${ncxNavPoints}</navMap>
</ncx>`);

  return await zip.generateAsync({ type: "nodebuffer" });
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
        --chapter="//*[name()='h1' or name()='h2' or name()='h3']" \
        --chapter-mark="pagebreak" \
        --page-breaks-before="//*[name()='h1' or name()='h2']" \
        --no-chapters-in-toc \
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
