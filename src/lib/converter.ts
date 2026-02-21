/**
 * Shared LibreOffice + system tool utilities for all conversion routes.
 * On EC2: install with: sudo apt-get install -y libreoffice poppler-utils
 * On Windows (local dev): install LibreOffice from https://www.libreoffice.org
 */

import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { tmpdir } from "os";
import { promisify } from "util";

const execAsync = promisify(exec);

// ── Find the LibreOffice binary ───────────────────────────────────────────────
let cachedSoffice: string | null | undefined = undefined;

export async function findLibreOffice(): Promise<string> {
    if (cachedSoffice !== undefined) {
        if (cachedSoffice === null) throw new Error("LibreOffice not found. Run: sudo apt-get install -y libreoffice");
        return cachedSoffice;
    }

    const candidates = [
        "libreoffice", "soffice",
        "/usr/bin/libreoffice", "/usr/bin/soffice",
        "/usr/lib/libreoffice/program/soffice",
        "/opt/libreoffice7.6/program/soffice",
        "/snap/bin/libreoffice",
        "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
        "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
    ];

    for (const cmd of candidates) {
        try {
            await execAsync(`"${cmd}" --version`, { timeout: 5000 });
            cachedSoffice = cmd;
            return cmd;
        } catch { continue; }
    }

    cachedSoffice = null;
    throw new Error(
        "LibreOffice not found.\n" +
        "EC2/Ubuntu: sudo apt-get install -y libreoffice poppler-utils\n" +
        "Windows: https://www.libreoffice.org/download/download/"
    );
}

// ── Core conversion: any Office format → any output format via LibreOffice ───
export async function convertWithLibreOffice(
    inputBuffer: Buffer,
    inputFilename: string,
    outputFormat: string,  // e.g. "pdf", "docx", "xlsx", "pptx"
    timestamp = Date.now()
): Promise<{ buffer: Buffer; outputFilename: string }> {
    const tempDir = path.join(tmpdir(), `convert-${timestamp}`);
    const safeName = inputFilename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const inputPath = path.join(tempDir, safeName);
    const baseStem = path.parse(safeName).name;
    const expectedOutput = path.join(tempDir, `${baseStem}.${outputFormat}`);

    try {
        await fs.promises.mkdir(tempDir, { recursive: true });
        await fs.promises.writeFile(inputPath, inputBuffer);

        const soffice = await findLibreOffice();
        const cmd = `"${soffice}" --headless --nologo --norestore --convert-to ${outputFormat} --outdir "${tempDir}" "${inputPath}"`;

        await execAsync(cmd, { timeout: 120_000 });

        // Find the output file (LibreOffice always names it <stem>.<format>)
        let outputPath = expectedOutput;
        if (!fs.existsSync(outputPath)) {
            const entries = await fs.promises.readdir(tempDir);
            const found = entries.find(e => e.endsWith(`.${outputFormat}`) && e !== safeName);
            if (!found) throw new Error(`LibreOffice did not produce a .${outputFormat} file`);
            outputPath = path.join(tempDir, found);
        }

        const buffer = await fs.promises.readFile(outputPath);
        const outputFilename = `${baseStem}.${outputFormat}`;
        return { buffer, outputFilename };
    } finally {
        fs.promises.rm(tempDir, { recursive: true, force: true }).catch(() => { });
    }
}

// ── PDF → Images using pdftoppm (poppler-utils) ───────────────────────────────
// Returns array of image buffers, one per page
export async function pdfToImages(
    pdfBuffer: Buffer,
    format: "jpeg" | "png" = "jpeg",
    dpi = 150,
    timestamp = Date.now()
): Promise<Buffer[]> {
    const tempDir = path.join(tmpdir(), `pdf2img-${timestamp}`);
    const inputPath = path.join(tempDir, "input.pdf");

    try {
        await fs.promises.mkdir(tempDir, { recursive: true });
        await fs.promises.writeFile(inputPath, pdfBuffer);

        const outPrefix = path.join(tempDir, "page");
        const flag = format === "png" ? "-png" : "-jpeg";

        // Try pdftoppm first (poppler-utils)
        try {
            await execAsync(
                `pdftoppm ${flag} -r ${dpi} "${inputPath}" "${outPrefix}"`,
                { timeout: 120_000 }
            );
        } catch {
            // Fallback: use LibreOffice Draw to export pages as images
            const soffice = await findLibreOffice();
            await execAsync(
                `"${soffice}" --headless --nologo --norestore --convert-to ${format} --outdir "${tempDir}" "${inputPath}"`,
                { timeout: 120_000 }
            );
        }

        // Collect all output images in order
        const entries = await fs.promises.readdir(tempDir);
        const imageFiles = entries
            .filter(e => e.startsWith("page") && (e.endsWith(".jpg") || e.endsWith(".jpeg") || e.endsWith(".png")))
            .sort((a, b) => {
                const na = parseInt(a.match(/\d+/)?.[0] ?? "0");
                const nb = parseInt(b.match(/\d+/)?.[0] ?? "0");
                return na - nb;
            });

        if (imageFiles.length === 0) throw new Error("No images produced from PDF");

        return await Promise.all(
            imageFiles.map(f => fs.promises.readFile(path.join(tempDir, f)))
        );
    } finally {
        fs.promises.rm(tempDir, { recursive: true, force: true }).catch(() => { });
    }
}
