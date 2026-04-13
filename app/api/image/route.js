import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json({ imageUrl: null, error: "Missing query" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !cx) {
    return NextResponse.json({ imageUrl: null, error: "Google API not configured" }, { status: 500 });
  }

  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query + " food recipe plated")}&searchType=image&num=1&safe=active&imgType=photo&imgSize=large`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.error) {
    console.error("Google API error:", data.error.message);
    return NextResponse.json({ imageUrl: null, error: data.error.message }, { status: 502 });
  }

  const imageUrl = data.items?.[0]?.link || null;
  return NextResponse.json({ imageUrl });
}
