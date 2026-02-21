import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import { tmpdir } from "os";

const execAsync = promisify(exec);

export const runtime = "nodejs";
export const maxDuration = 120;

async function findPython(): Promise<string> {
  // Check venv first (created with: python3 -m venv /opt/pdf2docx-env)
  const candidates = [
    "/opt/pdf2docx-env/bin/python",
    "/opt/pdf2docx-env/bin/python3",
    "python3",
    "python",
  ];
  for (const bin of candidates) {
    try {
      await execAsync(`${bin} -c "import pdf2docx"`);
      return bin; // This python has pdf2docx installed
    } catch (err) { }
  }
  throw new Error(
    "pdf2docx not found. On EC2 run: pip3 install pdf2docx --break-system-packages\n" +
    "OR: python3 -m venv /opt/pdf2docx-env && /opt/pdf2docx-env/bin/pip install pdf2docx"
  );
}

export async function POST(req: NextRequest) {
  const tmpId = Date.now().toString();
  const inputPath = path.join(tmpdir(), `pdftoword_${tmpId}.pdf`);
  const outputPath = path.join(tmpdir(), `pdftoword_${tmpId}.docx`);

  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0)
      return NextResponse.json({ error: "No PDF uploaded" }, { status: 400 });

    const file = files[0];
    const buffer = Buffer.from(await file.arrayBuffer());
    const baseName = file.name.replace(/\.[^/.]+$/, "");

    // Write input PDF
    fs.writeFileSync(inputPath, buffer);

    // Find python
    const python = await findPython();

    // Run pdf2docx conversion
    // pdf2docx preserves layout: text blocks, images, tables, columns
    const script = `
import sys
try:
    from pdf2docx import Converter
    cv = Converter("${inputPath.replace(/\\/g, "/")}")
    cv.convert("${outputPath.replace(/\\/g, "/")}", start=0, end=None)
    cv.close()
    print("SUCCESS")
except ImportError:
    print("IMPORT_ERROR")
    sys.exit(1)
except Exception as e:
    print(f"ERROR: {e}")
    sys.exit(1)
`;

    const { stdout, stderr } = await execAsync(`${python} -c "${script.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`, {
      timeout: 110000,
    });

    if (stdout.includes("IMPORT_ERROR")) {
      // pdf2docx not installed — try to install and retry once
      await execAsync(`pip3 install pdf2docx 2>&1 || pip install pdf2docx 2>&1`);
      const { stdout: stdout2 } = await execAsync(`${python} -c "${script.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`, {
        timeout: 110000,
      });
      if (!stdout2.includes("SUCCESS")) {
        throw new Error("pdf2docx conversion failed after install");
      }
    } else if (!stdout.includes("SUCCESS")) {
      throw new Error(`pdf2docx error: ${stdout} ${stderr}`);
    }

    if (!fs.existsSync(outputPath)) {
      throw new Error("Output DOCX not created");
    }

    const docxBuffer = fs.readFileSync(outputPath);

    return new NextResponse(new Uint8Array(docxBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${baseName}.docx"`,
      },
    });
  } catch (err: any) {
    console.error("❌ PDF→Word Error:", err.message);
    return NextResponse.json(
      { error: `Conversion failed: ${err.message}` },
      { status: 500 }
    );
  } finally {
    // Cleanup temp files
    try { fs.unlinkSync(inputPath); } catch (err) { }
    try { fs.unlinkSync(outputPath); } catch (err) { }
  }
}
