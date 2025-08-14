// app/api/avatar-proxy/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = req.url.split("url=")[1];
  if (!url) return NextResponse.json({ error: "No URL provided" }, { status: 400 });

  try {
    const response = await fetch(decodeURIComponent(url));
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";

    return new NextResponse(Buffer.from(buffer), {
      headers: { "Content-Type": contentType },
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 });
  }
}
