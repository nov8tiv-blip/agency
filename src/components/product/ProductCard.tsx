"use client";

import Link from "next/link";
import type { WooProduct } from "@/lib/types";

export default function ProductCard({ product }: { product: WooProduct }) {
  const image = product.images[0];

  return (
    <Link href={`/shop/${product.slug}`} className="group block">
      {/* Image */}
      <div className="aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 mb-3">
        {image ? (
          <img
            src={image.src}
            alt={image.alt || product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-gray-900 group-hover:text-gray-600 transition-colors truncate">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          {product.on_sale && product.regular_price && (
            <span className="text-xs text-gray-400 line-through">
              ${parseFloat(product.regular_price).toFixed(2)}
            </span>
          )}
          <span className="text-sm font-semibold text-gray-900">
            ${parseFloat(product.price).toFixed(2)}
          </span>
        </div>
      </div>
    </Link>
  );
}
