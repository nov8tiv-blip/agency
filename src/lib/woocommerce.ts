import { wooConfig } from "./config";
import type { WooProduct, WooVariation, WooCategory } from "./types";

function authParams() {
  return `consumer_key=${encodeURIComponent(wooConfig.consumerKey)}&consumer_secret=${encodeURIComponent(wooConfig.consumerSecret)}`;
}

function apiUrl(path: string, params: Record<string, string> = {}) {
  const base = `${wooConfig.url}/wp-json/wc/v3${path}`;
  const qs = new URLSearchParams({ ...params });
  return `${base}?${authParams()}&${qs.toString()}`;
}

export async function getProducts(params: {
  page?: number;
  per_page?: number;
  category?: string;
  search?: string;
} = {}): Promise<WooProduct[]> {
  const query: Record<string, string> = {
    per_page: String(params.per_page ?? 12),
    page: String(params.page ?? 1),
    status: "publish",
  };
  if (params.category) query.category = params.category;
  if (params.search) query.search = params.search;

  const res = await fetch(apiUrl("/products", query), {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`WooCommerce API error: ${res.status}`);
  return res.json();
}

export async function getProduct(slug: string): Promise<WooProduct | null> {
  const res = await fetch(apiUrl("/products", { slug }), {
    next: { revalidate: 60 },
  });
  if (!res.ok) return null;
  const products: WooProduct[] = await res.json();
  return products[0] ?? null;
}

export async function getProductVariations(
  productId: number
): Promise<WooVariation[]> {
  const res = await fetch(
    apiUrl(`/products/${productId}/variations`, { per_page: "100" }),
    { next: { revalidate: 60 } }
  );
  if (!res.ok) return [];
  return res.json();
}

export async function getCategories(): Promise<WooCategory[]> {
  const res = await fetch(apiUrl("/products/categories", { per_page: "100" }), {
    next: { revalidate: 300 },
  });
  if (!res.ok) return [];
  return res.json();
}

export async function createOrder(orderData: {
  line_items: { product_id: number; variation_id?: number; quantity: number }[];
  billing: Record<string, string>;
  shipping: Record<string, string>;
  payment_method: string;
}) {
  const res = await fetch(apiUrl("/orders"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...orderData,
      set_paid: false,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Order creation failed: ${err}`);
  }
  return res.json();
}
