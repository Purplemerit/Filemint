import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    if (!bucketName || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      return NextResponse.json(
        { error: "AWS S3 not configured. Add AWS_S3_BUCKET_NAME, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY to .env" },
        { status: 500 }
      );
    }

    const fileId = uuidv4();
    const fileExtension = file.name.split(".").pop() || "bin";
    const s3Key = `shared-files/${fileId}.${fileExtension}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      Body: buffer,
      ContentType: file.type || "application/octet-stream",
      // Files auto-expire after 2 hours via S3 lifecycle rules (see setup instructions)
      Metadata: {
        originalFileName: file.name,
        uploadedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      },
    }));

    // Public URL — requires the bucket to have public read ACL or a bucket policy
    const region = process.env.AWS_REGION || "us-east-1";
    const s3Url = `https://${bucketName}.s3.${region}.amazonaws.com/${s3Key}`;

    return NextResponse.json({ url: s3Url, fileId });
  } catch (error) {
    console.error("S3 Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
