import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getStore } from "@netlify/blobs";

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
    const hasS3Config = bucketName && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;

    let fileBuffer: Buffer | null = null;
    let metadata: any = null;
    let contentType: string | null = null;

    if (hasS3Config) {
      try {
        // Get file metadata first from S3
        const headParams = {
          Bucket: bucketName,
          Key: `shared-files/${filename}`,
        };

        const headResponse = await s3Client.send(new HeadObjectCommand(headParams));
        metadata = headResponse.Metadata;

        // Check if file has expired
        if (metadata?.expiresat) {
          const expiryDate = new Date(metadata.expiresat);
          if (new Date() > expiryDate) {
            return new NextResponse(
              JSON.stringify({
                error: "File has expired",
                message: "The file you're looking for has expired and is no longer available."
              }),
              { status: 410, headers: { 'Content-Type': 'application/json' } }
            );
          }
        }

        // Get the file from S3
        const getParams = {
          Bucket: bucketName,
          Key: `shared-files/${filename}`,
        };

        const response = await s3Client.send(new GetObjectCommand(getParams));

        if (response.Body) {
          const chunks: Uint8Array[] = [];
          for await (const chunk of response.Body as any) {
            chunks.push(chunk);
          }
          fileBuffer = Buffer.concat(chunks);
          contentType = response.ContentType || null;
        }
      } catch (s3Error: any) {
        console.warn("S3 retrieval failed, trying Netlify Blobs:", s3Error.message);
      }
    }

    // If not found in S3 or S3 not configured, try Netlify Blobs
    if (!fileBuffer) {
      try {
        const store = getStore("shared-files");
        const item = await store.getWithMetadata(filename, { type: "blob" });

        if (item && item.data) {
          fileBuffer = Buffer.from(await item.data.arrayBuffer());
          metadata = item.metadata;

          // Check expiry for Netlify Blobs
          if (metadata?.expiresAt) {
            const expiryDate = new Date(metadata.expiresAt);
            if (new Date() > expiryDate) {
              return new NextResponse(
                JSON.stringify({
                  error: "File has expired",
                  message: "The file you're looking for has expired and is no longer available."
                }),
                { status: 410, headers: { 'Content-Type': 'application/json' } }
              );
            }
          }
        }
      } catch (blobError: any) {
        console.error("Netlify Blobs retrieval failed:", blobError.message);
      }
    }

    if (!fileBuffer) {
      if (!hasS3Config && !process.env.NETLIFY) {
        return new NextResponse(
          JSON.stringify({
            error: "Storage not configured",
            message: "Neither AWS S3 nor Netlify Blobs is properly configured. Please contact the administrator."
          }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new NextResponse(
        JSON.stringify({
          error: "File not found",
          message: "The file you're looking for may have been deleted or the link is invalid."
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Determine content type based on file extension
    const extension = filename.split('.').pop()?.toLowerCase();
    const contentTypeMap: Record<string, string> = {
      'pdf': 'application/pdf',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'txt': 'text/plain',
      'zip': 'application/zip',
      'mp3': 'audio/mpeg',
      'mp4': 'video/mp4',
    };

    const finalContentType = contentType || contentTypeMap[extension || ''] || 'application/octet-stream';
    const originalFileName = metadata?.originalfilename || metadata?.originalFileName || filename;

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': finalContentType,
        'Content-Disposition': `inline; filename="${originalFileName}"`,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: any) {
    console.error("File serving error:", error);
    return new NextResponse(
      JSON.stringify({
        error: "File retrieval failed",
        message: "An error occurred while retrieving the file. Please try again later."
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
