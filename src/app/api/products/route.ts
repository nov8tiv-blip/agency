import { NextRequest, NextResponse } from "next/server";
import { getProducts, getProduct } from "@/lib/woocommerce";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const slug = searchParams.get("slug");

  try {
    if (slug) {
      const product = await getProduct(slug);
      if (!product)
        return NextResponse.json([], { status: 200 });
      return NextResponse.json([product]);
    }

    const products = await getProducts({
      page: Number(searchParams.get("page")) || 1,
      per_page: Number(searchParams.get("per_page")) || 12,
      category: searchParams.get("category") ?? undefined,
      search: searchParams.get("search") ?? undefined,
    });
    return NextResponse.json(products);
  } catch (e) {
    const message = e instanceof Error ? e.message : "API error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
