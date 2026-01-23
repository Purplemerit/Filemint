import { IncomingForm, File } from "formidable";
import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { NextRequest } from "next/server";
import { Readable } from "stream";
import os from "os";
import { PDFDocument } from "pdf-lib";

const execAsync = promisify(exec);

class MockIncomingMessage extends Readable {
  headers: Record<string, string>;
  constructor(buffer: Buffer, contentType: string) {
    super();
    this.headers = {
      "content-length": buffer.length.toString(),
      "content-type": contentType,
    };
    this.push(buffer);
    this.push(null);
  }
  _read() { }
}

async function hasQpdf(): Promise<boolean> {
  try {
    await execAsync("qpdf --version");
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const uploadDir = os.tmpdir();
  const form = new IncomingForm({
    multiples: false,
    uploadDir,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    keepExtensions: true,
  });

  try {
    const buffer = Buffer.from(await req.arrayBuffer());
    const contentType = req.headers.get("content-type") || "multipart/form-data";
    const mockReq = new MockIncomingMessage(buffer, contentType);

    return new Promise((resolve) => {
      form.parse(mockReq as any, async (err: any, fields: any, files: { file?: File[] }) => {
        if (err) {
          console.error("Form parsing error:", err);
          return resolve(
            new Response(JSON.stringify({ error: "Failed to parse form data" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            })
          );
        }

        const file = files.file?.[0];
        if (!file || !file.mimetype?.includes("pdf")) {
          return resolve(
            new Response(JSON.stringify({ error: "Please upload a single PDF file." }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            })
          );
        }

        const inputPath = file.filepath;
        const outputPath = path.join(uploadDir, `compressed-${Date.now()}.pdf`);
        const qpdfAvailable = await hasQpdf();

        try {
          let outputBuffer: Buffer;

          if (qpdfAvailable) {
            // 🧩 Local / Docker mode — use qpdf
            console.log("Using qpdf compression");
            await execAsync(`qpdf --linearize --object-streams=generate "${inputPath}" "${outputPath}"`);
            outputBuffer = await fs.readFile(outputPath);
          } else {
            // ☁️ Serverless mode — fallback to pdf-lib compression
            console.log("qpdf not found, using pdf-lib fallback");
            const existingPdfBytes = await fs.readFile(inputPath);
            const pdfDoc = await PDFDocument.load(existingPdfBytes);
            const optimized = await pdfDoc.save({ useObjectStreams: true });
            outputBuffer = Buffer.from(optimized);
          }

          return resolve(
            new Response(outputBuffer as any, {
              headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename=compressed_${path.basename(file.originalFilename || "file.pdf")}`,
              },
            })
          );
        } catch (error) {
          console.error("Compression error:", error);
          return resolve(
            new Response(JSON.stringify({ error: "Compression failed" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            })
          );
        } finally {
          try {
            await fs.unlink(inputPath).catch(() => { });
            await fs.unlink(outputPath).catch(() => { });
          } catch (cleanupError) {
            console.error("Cleanup failed:", cleanupError);
          }
        }
      });
    });
  } catch (error) {
    console.error("Request processing error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
