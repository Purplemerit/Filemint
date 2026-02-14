import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const bucketName = process.env.AWS_S3_BUCKET_NAME;

    if (!bucketName || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      return new NextResponse(
        JSON.stringify({
          error: "Storage not configured",
          message: "AWS S3 is not properly configured. Please contact the administrator."
        }),
        {
          status: 503,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Get file metadata first
    const headParams = {
      Bucket: bucketName,
      Key: `shared-files/${filename}`,
    };

    const headResponse = await s3Client.send(new HeadObjectCommand(headParams));
    const metadata = headResponse.Metadata;

    // Check if file has expired
    if (metadata?.expiresat) {
      const expiryDate = new Date(metadata.expiresat);
      if (new Date() > expiryDate) {
        return new NextResponse(
          JSON.stringify({
            error: "File has expired",
            message: "The file you're looking for has expired and is no longer available."
          }),
          {
            status: 410,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }
    }

    // Get the file
    const getParams = {
      Bucket: bucketName,
      Key: `shared-files/${filename}`,
    };

    const response = await s3Client.send(new GetObjectCommand(getParams));

    if (!response.Body) {
      throw new Error("File not found");
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }
    const fileBuffer = Buffer.concat(chunks);

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

    // Use S3 ContentType if available, otherwise fall back to extension mapping
    const contentType = response.ContentType || contentTypeMap[extension || ''] || 'application/octet-stream';
    const originalFileName = metadata?.originalfilename || filename;

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
  } catch (error: any) {
    console.error("File serving error:", error);

    // Handle specific S3 errors
    if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
      return new NextResponse(
        JSON.stringify({
          error: "File not found",
          message: "The file you're looking for may have been deleted or the link is invalid."
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return new NextResponse(
      JSON.stringify({
        error: "File retrieval failed",
        message: "An error occurred while retrieving the file. Please try again later."
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
