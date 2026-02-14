import { NextRequest, NextResponse } from 'next/server';
import { 
  Document, Packer, Paragraph, TextRun, 
  AlignmentType, TabStopType, ImageRun,
  HorizontalPositionRelativeFrom, VerticalPositionRelativeFrom,
  TextWrappingType, TextWrappingSide
} from 'docx';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
const { createCanvas, Image } = require('canvas');

// Configure PDF.js worker
if (typeof window === 'undefined') {
  try {
    const pdfjsWorker = require('pdfjs-dist/build/pdf.worker.min.js');
    GlobalWorkerOptions.workerSrc = pdfjsWorker;
  } catch (e) {
    GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/build/pdf.worker.min.js');
  }
}

// --- High-Fidelity Data Structures ---

interface TextRunData {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
  isBold: boolean;
  isItalic: boolean;
}

interface ImageData {
  x: number;
  y: number;
  width: number;
  height: number;
  buffer: Buffer;
}

interface PageLine {
  y: number;
  height: number;
  runs: TextRunData[];
}

interface PageData {
  pageNumber: number;
  width: number;
  height: number;
  lines: PageLine[];
  images: ImageData[];
}

function getStylesFromFont(fontName: string): { isBold: boolean, isItalic: boolean, cleanName: string } {
  if (!fontName) return { isBold: false, isItalic: false, cleanName: "Arial" };
  const name = fontName.toLowerCase();
  
  // Extract clean name (remove subsets like ABCDEF+)
  let cleanName = fontName;
  if (cleanName.includes('+')) {
    cleanName = cleanName.split('+')[1];
  }
  
  const isBold = name.includes('bold') || name.includes('black') || name.includes('heavy') || name.includes('700') || name.includes('800') || name.includes('900');
  const isItalic = name.includes('italic') || name.includes('oblique');
  
  return { isBold, isItalic, cleanName };
}

async function extractHighFidelityLayout(pdfBuffer: Buffer): Promise<PageData[]> {
  const uint8Array = new Uint8Array(pdfBuffer);
  const loadingTask = getDocument({ data: uint8Array });
  const pdf = await loadingTask.promise;
  const pages: PageData[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });
    const { width, height } = viewport;

    // 1. Text Extraction
    const fragments: TextRunData[] = textContent.items
      .filter((item: any) => item.str.trim().length > 0)
      .map((item: any) => {
        const transform = item.transform;
        const styles = getStylesFromFont(item.fontName);
        return {
          text: item.str,
          x: transform[4],
          y: transform[5],
          width: item.width,
          height: Math.abs(transform[0] || transform[3] || 12),
          fontSize: Math.abs(transform[0] || transform[3] || 12),
          fontName: styles.cleanName,
          isBold: styles.isBold,
          isItalic: styles.isItalic
        };
      });

    // Group text into lines
    const lineMap = new Map<number, TextRunData[]>();
    fragments.forEach(frag => {
      let foundLineY = Array.from(lineMap.keys()).find(y => Math.abs(y - frag.y) <= 3);
      if (foundLineY !== undefined) lineMap.get(foundLineY)!.push(frag);
      else lineMap.set(frag.y, [frag]);
    });

    const lines: PageLine[] = Array.from(lineMap.entries())
      .map(([y, runs]) => ({ y, height: Math.max(...runs.map(r => r.height)), runs: runs.sort((a,b) => a.x - b.x) }))
      .sort((a, b) => b.y - a.y);

    // 2. Image Extraction (Advanced Operator Parsing)
    const images: ImageData[] = [];
    try {
      const ops = await page.getOperatorList();
      const fnArray = ops.fnArray;
      const argsArray = ops.argsArray;

      for (let i = 0; i < fnArray.length; i++) {
        // Look for PaintImageXObject or PaintInlineImageXObject
        if (fnArray[i] === (pdfjsLib as any).OPS.paintImageXObject || 
            fnArray[i] === (pdfjsLib as any).OPS.paintInlineImageXObject) {
          
          const imgName = argsArray[i][0];
          try {
            const imgObj = await page.objs.get(imgName);
            if (imgObj && imgObj.data) {
              const canvas = createCanvas(imgObj.width, imgObj.height);
              const ctx = canvas.getContext('2d');
              
              // This is a simplified image extraction
              // Real-world implementation would need to handle masks and different color spaces
              const imageData = ctx.createImageData(imgObj.width, imgObj.height);
              imageData.data.set(imgObj.data);
              ctx.putImageData(imageData, 0, 0);

              // We need to find the transform for this image to get its position
              // This is complex because the transform is usually set by a previous CMS command
              // For now, we capture the image data. Full spatial mapping of images is limited in this environment.
              
              images.push({
                x: 0, // Fallback
                y: 0, // Fallback
                width: imgObj.width / 2, // Scale heuristic
                height: imgObj.height / 2,
                buffer: canvas.toBuffer('image/png')
              });
            }
          } catch (e) { console.error("Image object extraction failed", e); }
        }
      }
    } catch (e) { console.error("Operator parsing failed", e); }

    pages.push({ pageNumber: pageNum, width, height, lines, images });
  }
  return pages;
}

// Global variable support for pdfjsLib constant access
const pdfjsLib: any = require('pdfjs-dist');

async function buildMasterpieceDocx(pages: PageData[]): Promise<Buffer> {
  const sections = pages.map(page => {
    return {
      properties: {
        page: {
          size: { width: Math.round(page.width * 20), height: Math.round(page.height * 20) },
          margin: { top: 0, right: 0, bottom: 0, left: 0 } // Borderless for true fidelity
        }
      },
      children: [
        // 1. Handle Images as Floating Anchors
        ...page.images.map(img => new Paragraph({
          children: [
            new ImageRun({
              data: img.buffer,
              transformation: { width: img.width, height: img.height },
              floating: {
                horizontalPosition: { offset: Math.round(img.x * 20), relative: HorizontalPositionRelativeFrom.PAGE },
                verticalPosition: { offset: Math.round((page.height - img.y) * 20), relative: VerticalPositionRelativeFrom.PAGE },
                wrap: { type: TextWrappingType.SQUARE, side: TextWrappingSide.BOTH },
              }
            })
          ]
        })),

        // 2. Handle Text Lines
        ...page.lines.map((line, lineIdx) => {
          const textRuns: TextRun[] = [];
          line.runs.forEach((run, runIdx) => {
            if (runIdx > 0) {
              const lastRun = line.runs[runIdx - 1];
              const gap = run.x - (lastRun.x + lastRun.width);
              if (gap > 2) textRuns.push(new TextRun(" "));
            }
            textRuns.push(new TextRun({
              text: run.text,
              size: Math.round(run.fontSize * 2),
              bold: run.isBold,
              italics: run.isItalic,
              font: run.fontName
            }));
          });

          return new Paragraph({
            indent: { left: Math.round(line.runs[0].x * 20) },
            spacing: { 
              before: lineIdx === 0 ? Math.round((page.height - line.y) * 20) : 0,
              line: Math.round(line.height * 20),
              lineRule: 'auto'
            },
            children: textRuns
          });
        })
      ]
    };
  });

  const doc = new Document({ sections });
  return await Packer.toBuffer(doc);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    if (!files?.length) return NextResponse.json({ error: 'No files' }, { status: 400 });

    const pdfBuffer = Buffer.from(await files[0].arrayBuffer());
    const pages = await extractHighFidelityLayout(pdfBuffer);
    const docBuffer = await buildMasterpieceDocx(pages);

    return new NextResponse(docBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="converted_${files[0].name.split('.')[0]}.docx"`,
      },
    });
  } catch (error: any) {
    console.error('High-Fidelity PDF to Word Error:', error);
    return NextResponse.json({ error: 'Fidelity conversion failed', details: error.message }, { status: 500 });
  }
}
