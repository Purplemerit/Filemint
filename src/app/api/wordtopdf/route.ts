import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { tmpdir } from "os";
import { promisify } from "util";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const execAsync = promisify(exec);

// ── Locate the LibreOffice / soffice binary ───────────────────────────────────
async function findLibreOffice(): Promise<string> {
  const candidates = [
    // Linux (Ubuntu / Amazon Linux / Debian)
    "libreoffice",
    "soffice",
    "/usr/bin/libreoffice",
    "/usr/bin/soffice",
    "/usr/lib/libreoffice/program/soffice",
    "/opt/libreoffice/program/soffice",
    // Windows (local development)
    "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
    "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
  ];

  for (const cmd of candidates) {
    try {
      await execAsync(`"${cmd}" --version`, { timeout: 5000 });
      return cmd;
    } catch {
      continue;
    }
  }

  throw new Error(
    "LibreOffice not found.\n" +
    "On EC2/Ubuntu: sudo apt-get install -y libreoffice\n" +
    "On Windows:    https://www.libreoffice.org/download/download/"
  );
}

// ── Main Route ────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const timestamp = Date.now();
  const tempDir = path.join(tmpdir(), `wordtopdf-${timestamp}`);

  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const file = files[0];
    const buffer = Buffer.from(await file.arrayBuffer());
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

    // Create isolated temp directory for this conversion
    await fs.promises.mkdir(tempDir, { recursive: true });

    const inputPath = path.join(tempDir, safeName);
    const outputPath = path.join(tempDir, `${path.parse(safeName).name}.pdf`);

    // Write the DOCX to disk
    await fs.promises.writeFile(inputPath, buffer);

    // Find LibreOffice binary
    const soffice = await findLibreOffice();

    // Run: libreoffice --headless --convert-to pdf --outdir /tmp/xxx /tmp/xxx/file.docx
    const cmd = `"${soffice}" --headless --nologo --norestore --convert-to pdf --outdir "${tempDir}" "${inputPath}"`;

    console.log(`🔄 Converting: ${file.name} → PDF`);
    const { stdout, stderr } = await execAsync(cmd, { timeout: 55000 });

    if (stdout) console.log("LibreOffice stdout:", stdout);
    if (stderr) console.warn("LibreOffice stderr:", stderr);

    // Find the output PDF (LibreOffice names it after the input file)
    let pdfPath = outputPath;
    if (!fs.existsSync(pdfPath)) {
      // Fallback: scan the temp dir for any .pdf
      const entries = await fs.promises.readdir(tempDir);
      const pdfFile = entries.find(e => e.endsWith(".pdf"));
      if (!pdfFile) throw new Error("LibreOffice did not produce a PDF.");
      pdfPath = path.join(tempDir, pdfFile);
    }

    const pdfBuffer = await fs.promises.readFile(pdfPath);
    console.log(`✅ Converted: ${file.name} → ${baseName}.pdf (${pdfBuffer.length} bytes)`);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${baseName}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error("❌ Word-to-PDF Error:", err.message);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  } finally {
    // Always clean up temp files
    fs.promises.rm(tempDir, { recursive: true, force: true }).catch(() => { });
  }
}
