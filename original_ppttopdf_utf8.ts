import { NextRequest, NextResponse } from 'next/server';
import { tmpdir } from 'os';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import puppeteer from 'puppeteer';

export async function POST(req: NextRequest) {
  let tempPdfPath = '';

  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return new NextResponse(
        JSON.stringify({ error: 'No PowerPoint file uploaded' }),
        { status: 400 }
      );
    }

    const pptFile = files[0];
    const arrayBuffer = await pptFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Γ£à Use adm-zip to read .pptx structure
    const zip = new AdmZip(buffer);
    const slideFiles = zip.getEntries().filter(
      entry =>
        entry.entryName.startsWith('ppt/slides/slide') &&
        entry.entryName.endsWith('.xml')
    );

    const slideTitles: string[] = [];

    for (const slide of slideFiles) {
      const xml = slide.getData().toString('utf8');
      const matches = xml.match(/<a:t>([^<]+)<\/a:t>/g);
      if (matches) {
        const text = matches.map(m => m.replace(/<\/?a:t>/g, '')).join(' ');
        slideTitles.push(text);
      } else {
        slideTitles.push('Untitled Slide');
      }
    }

    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 2rem; }
            .slide { page-break-after: always; border: 2px solid #ccc; padding: 2rem; margin-bottom: 2rem; }
            h2 { margin-top: 0; color: #d9534f; }
          </style>
        </head>
        <body>
          ${slideTitles
            .map(
              (title, i) =>
                `<div class="slide"><h2>Slide ${i + 1}</h2><p>${title}</p></div>`
            )
            .join('')}
        </body>
      </html>
    `;

    // Γ£à Generate PDF
    tempPdfPath = path.join(tmpdir(), `ppt-${Date.now()}.pdf`);
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({ path: tempPdfPath, format: 'A4' });
    await browser.close();

    const pdfBuffer = await fs.promises.readFile(tempPdfPath);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="converted.pdf"',
      },
    });
  } catch (error: any) {
    console.error('Error during PowerPoint to PDF conversion:', error);
    return new NextResponse(
      JSON.stringify({ error: `Conversion failed: ${error.message}` }),
      { status: 500 }
    );
  } finally {
    try {
      if (tempPdfPath && fs.existsSync(tempPdfPath)) {
        await fs.promises.unlink(tempPdfPath);
      }
    } catch (cleanupError) {
      console.error('Error cleaning up PDF temp file:', cleanupError);
    }
  }
}
