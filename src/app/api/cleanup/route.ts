import { NextResponse } from "next/server";
import { readdir, unlink, stat } from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const uploadsDir = path.join(process.cwd(), "public", "shared");
    const files = await readdir(uploadsDir);
    const now = Date.now();
    const twoHours = 2 * 60 * 60 * 1000;
    
    let deleted = 0;
    
    for (const file of files) {
      const filePath = path.join(uploadsDir, file);
      const stats = await stat(filePath);
      
      if (now - stats.mtimeMs > twoHours) {
        await unlink(filePath);
        deleted++;
      }
    }
    
    return NextResponse.json({ deleted, message: `Cleaned up ${deleted} files` });
  } catch (error) {
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}