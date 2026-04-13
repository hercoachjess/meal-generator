import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  const url = `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_API_KEY}&cx=${process.env.GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(query + " food recipe plated")}&searchType=image&num=1&safe=active&imgType=photo&imgSize=large`;

  const response = await fetch(url);
  const data = await response.json();

  const imageUrl = data.items?.[0]?.link || null;
  return NextResponse.json({ imageUrl });
}