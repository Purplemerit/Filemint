import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { tmpdir } from "os";
import { promisify } from "util";
import { NextRequest, NextResponse } from "next/server";
import archiver from "archiver";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import mammoth from "mammoth";

const execAsync = promisify(exec);

async function libreOfficeExists() {
  try {
    await execAsync("libreoffice --version");
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const timestamp = Date.now();
  const uploadDir = path.join(tmpdir(), `batch-docx-${timestamp}`);
  const outputDir = path.join(tmpdir(), `batch-out-${timestamp}`);

  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files?.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    await fs.promises.mkdir(uploadDir, { recursive: true });
    await fs.promises.mkdir(outputDir, { recursive: true });

    const pdfPaths: string[] = [];
    const libreAvailable = await libreOfficeExists();

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const tempDocxPath = path.join(uploadDir, safeName);
      await fs.promises.writeFile(tempDocxPath, buffer);

      const baseName = path.parse(file.name).name;
      const pdfFullPath = path.join(outputDir, `${baseName}.pdf`);

      if (libreAvailable) {
        // 🧩 Local mode — use LibreOffice
        const convertCommand = `libreoffice --headless --nologo --convert-to pdf --outdir "${outputDir}" "${tempDocxPath}"`;
        await execAsync(convertCommand);
      } else {
        // ☁️ Serverless mode — use Puppeteer
        const { value: html } = await mammoth.convertToHtml({ buffer });

        const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_VERSION;
        const executablePath = isLambda
          ? await chromium.executablePath()
          : puppeteer.executablePath();

        const browser = await puppeteer.launch({
          args: chromium.args,
          defaultViewport: chromium.defaultViewport,
          executablePath,
          headless: true,
        });

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "load" });
        const pdfBuffer = await page.pdf({ format: "A4" });
        await browser.close();

        await fs.promises.writeFile(pdfFullPath, pdfBuffer);
      }

      if (!fs.existsSync(pdfFullPath)) {
        throw new Error(`Failed to convert ${file.name} to PDF`);
      }

      pdfPaths.push(pdfFullPath);
    }

    // Zip files
    const zipPath = path.join(tmpdir(), `converted-${timestamp}.zip`);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    const zipFinished = new Promise<Buffer>((resolve, reject) => {
      output.on("close", async () => {
        const zipBuffer = await fs.promises.readFile(zipPath);
        resolve(zipBuffer);
      });
      archive.on("error", reject);
    });

    archive.pipe(output);
    for (const pdfPath of pdfPaths) archive.file(pdfPath, { name: path.basename(pdfPath) });
    await archive.finalize();
    const zipBuffer = await zipFinished;

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="converted_pdfs.zip"',
      },
    });
  } catch (error: any) {
    console.error("Batch conversion error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    try {
      if (fs.existsSync(uploadDir)) await fs.promises.rm(uploadDir, { recursive: true, force: true });
      if (fs.existsSync(outputDir)) await fs.promises.rm(outputDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error("Cleanup error:", cleanupError);
    }
  }
}
