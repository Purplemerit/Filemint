import { NextRequest, NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';
import { Document, Packer, Paragraph } from 'docx';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

// Configure PDF.js worker - use local worker for serverless environments
if (typeof window === 'undefined') {
  // Server-side: use the worker from node_modules
  try {
    const pdfjsWorker = require('pdfjs-dist/build/pdf.worker.min.js');
    GlobalWorkerOptions.workerSrc = pdfjsWorker;
  } catch (e) {
    // Fallback to require.resolve path
    GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/build/pdf.worker.min.js');
  }
} else {
  // Client-side fallback (shouldn't be used in this API route)
  GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

async function extractTextWithPdfJs(pdfBuffer: Buffer): Promise<string> {
  try {
    // Convert Buffer to Uint8Array for PDF.js
    const uint8Array = new Uint8Array(pdfBuffer);

    const loadingTask = getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }

    return fullText;
  } catch (error) {
    console.error('PDF.js extraction failed:', error);
    throw error;
  }
}

async function convertPdfToDocx(pdfFile: File): Promise<Buffer> {
  console.log('Converting PDF to DOCX, file size:', pdfFile.size, 'bytes');
  const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());
  let extractedText = '';

  try {
    // Try pdf-parse first
    console.log('Attempting extraction with pdf-parse...');
    const data = await pdfParse(pdfBuffer);
    extractedText = data.text;
    console.log('Extracted Text using pdf-parse, length:', extractedText.length);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.log('pdf-parse failed, trying PDF.js fallback. Error:', errorMsg);

    try {
      // Fallback to PDF.js
      console.log('Attempting extraction with PDF.js...');
      extractedText = await extractTextWithPdfJs(pdfBuffer);
      console.log('Extracted Text using PDF.js, length:', extractedText.length);
    } catch (fallbackError) {
      const fallbackMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
      console.error('Both extraction methods failed. pdf-parse error:', errorMsg, 'PDF.js error:', fallbackMsg);
      throw new Error(`Failed to extract text from PDF. pdf-parse: ${errorMsg}, PDF.js: ${fallbackMsg}`);
    }
  }

  if (!extractedText || extractedText.trim().length === 0) {
    throw new Error('No text could be extracted from the PDF. The PDF may contain only images.');
  }

  console.log('Extracted Text:', extractedText.substring(0, 200) + '...');

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: extractedText.split('\n').map(line => new Paragraph(line.trim())),
      },
    ],
  });

  const docxBuffer = await Packer.toBuffer(doc);
  return docxBuffer;
}

export async function POST(req: NextRequest) {
  try {
    console.log('PDF to Word conversion API called');
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];


    console.log("Uploaded Files:", files.map(f => ({ name: f.name, size: f.size, type: f.type })));

    if (!files || files.length === 0) {
      return new NextResponse(
        JSON.stringify({ error: 'No files provided' }),
        { status: 400 }
      );
    }

    console.log('Starting conversion for file:', files[0].name);
    const docFileBuffer = await convertPdfToDocx(files[0]);
    console.log('Conversion successful, buffer size:', docFileBuffer.length);

    return new NextResponse(docFileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="converted.docx"',
      },
    });
  } catch (error) {
    console.error('Error during PDF to DOCX conversion:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : '';

    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
      type: error?.constructor?.name
    });

    return new NextResponse(
      JSON.stringify({
        error: 'An error occurred during file upload or conversion',
        details: errorMessage,
        type: error?.constructor?.name
      }),
      { status: 500 }
    );
  }
}
