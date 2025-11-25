import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@netlify/blobs";

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename;

    // Get Netlify Blobs store
    const store = getStore({
      name: "shared-files",
      consistency: "strong",
    });

    // Retrieve file from Netlify Blobs
    const blob = await store.get(filename, { type: "arrayBuffer" });

    if (!blob) {
      throw new Error("File not found");
    }

    const fileBuffer = Buffer.from(blob as ArrayBuffer);

    // Get metadata
    const metadata = await store.getMetadata(filename);

    // Determine content type based on file extension
    const extension = filename.split('.').pop()?.toLowerCase();
    const contentTypeMap: Record<string, string> = {
      // PDFs
      'pdf': 'application/pdf',
      
      // Images
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'bmp': 'image/bmp',
      'ico': 'image/x-icon',
      'tiff': 'image/tiff',
      'tif': 'image/tiff',
      
      // Documents
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'odt': 'application/vnd.oasis.opendocument.text',
      'ods': 'application/vnd.oasis.opendocument.spreadsheet',
      'odp': 'application/vnd.oasis.opendocument.presentation',
      
      // Text
      'txt': 'text/plain',
      'csv': 'text/csv',
      'html': 'text/html',
      'htm': 'text/html',
      'css': 'text/css',
      'js': 'text/javascript',
      'json': 'application/json',
      'xml': 'application/xml',
      'md': 'text/markdown',
      
      // Archives
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed',
      '7z': 'application/x-7z-compressed',
      'tar': 'application/x-tar',
      'gz': 'application/gzip',
      
      // Audio
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg',
      'flac': 'audio/flac',
      'm4a': 'audio/mp4',
      
      // Video
      'mp4': 'video/mp4',
      'avi': 'video/x-msvideo',
      'mov': 'video/quicktime',
      'wmv': 'video/x-ms-wmv',
      'flv': 'video/x-flv',
      'webm': 'video/webm',
      'mkv': 'video/x-matroska',
    };

    // Use metadata mimeType if available, otherwise fall back to extension mapping
    const contentType = (metadata?.mimeType as string) || contentTypeMap[extension || ''] || 'application/octet-stream';
    const originalFileName = (metadata?.fileName as string) || filename;

    // Check if file has expired
    if (metadata?.expiresAt) {
      const expiryDate = new Date(metadata.expiresAt as string);
      if (new Date() > expiryDate) {
        throw new Error("File has expired");
      }
    }

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${originalFileName}"`,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error("File serving error:", error);
    return new NextResponse(
      JSON.stringify({ 
        error: "File not found or has expired",
        message: "The file you're looking for may have been deleted or the link has expired."
      }),
      {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
