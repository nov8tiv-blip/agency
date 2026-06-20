import { NextRequest, NextResponse } from "next/server";
import { createOrder } from "@/lib/woocommerce";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const order = await createOrder({
      line_items: body.line_items,
      billing: body.billing,
      shipping: body.shipping,
      payment_method: "cod",
    });
    return NextResponse.json(order, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Order failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
