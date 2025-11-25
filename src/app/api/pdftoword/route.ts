import { NextRequest, NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';
import { Document, Packer, Paragraph } from 'docx';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

// Configure PDF.js worker
GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

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
  const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());
  let extractedText = '';

  try {
    // Try pdf-parse first
    const data = await pdfParse(pdfBuffer);
    extractedText = data.text;
    console.log('Extracted Text using pdf-parse');
  } catch (error) {
    console.log('pdf-parse failed, trying PDF.js fallback:', error);

    try {
      // Fallback to PDF.js
      extractedText = await extractTextWithPdfJs(pdfBuffer);
      console.log('Extracted Text using PDF.js');
    } catch (fallbackError) {
      console.error('Both extraction methods failed:', fallbackError);
      throw new Error('Failed to extract text from PDF. The PDF may be corrupted or encrypted.');
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

    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

   
    console.log("Uploaded Files:", files);

    if (!files || files.length === 0) {
      return new NextResponse(
        JSON.stringify({ error: 'No files provided' }),
        { status: 400 }
      );
    }

    const docFileBuffer = await convertPdfToDocx(files[0]);

    return new NextResponse(docFileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="converted.docx"',
      },
    });
  } catch (error) {
    console.error('Error during PDF to DOCX conversion:', error);
    return new NextResponse(
      JSON.stringify({ error: 'An error occurred during file upload or conversion' }),
      { status: 500 }
    );
  }
}
