"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import type { WooProduct } from "@/lib/types";

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const { addItem } = useCart();
  const [product, setProduct] = useState<WooProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [added, setAdded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/products?slug=${slug}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        const p = Array.isArray(data) ? data[0] : data;
        if (!p) throw new Error("Not found");
        setProduct(p);

        const sizeAttr = p.attributes?.find(
          (a: { name: string }) =>
            a.name.toLowerCase() === "size" || a.name.toLowerCase() === "sizes"
        );
        if (sizeAttr?.options?.[0]) setSelectedSize(sizeAttr.options[0]);

        const colorAttr = p.attributes?.find(
          (a: { name: string }) =>
            a.name.toLowerCase() === "color" ||
            a.name.toLowerCase() === "colour"
        );
        if (colorAttr?.options?.[0]) setSelectedColor(colorAttr.options[0]);
      } catch {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  function handleAdd() {
    if (!product) return;
    addItem({
      productId: product.id,
      name: product.name,
      image: product.images[0]?.src ?? "",
      price: parseFloat(product.price),
      quantity: 1,
      size: selectedSize || undefined,
      color: selectedColor || undefined,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-pulse">
          <div className="aspect-[3/4] rounded-xl bg-gray-100" />
          <div className="space-y-4 py-8">
            <div className="h-8 bg-gray-100 rounded w-3/4" />
            <div className="h-6 bg-gray-100 rounded w-1/4" />
            <div className="h-20 bg-gray-100 rounded w-full mt-8" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Product not found</h1>
        <p className="mt-2 text-gray-500">
          This product may no longer be available.
        </p>
      </div>
    );
  }

  const sizeAttr = product.attributes?.find(
    (a) => a.name.toLowerCase() === "size" || a.name.toLowerCase() === "sizes"
  );
  const colorAttr = product.attributes?.find(
    (a) =>
      a.name.toLowerCase() === "color" || a.name.toLowerCase() === "colour"
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Images */}
        <div className="space-y-4">
          <div className="aspect-[3/4] rounded-xl overflow-hidden bg-gray-100">
            {product.images[selectedImage] ? (
              <img
                src={product.images[selectedImage].src}
                alt={product.images[selectedImage].alt || product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                No image
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(i)}
                  className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                    i === selectedImage
                      ? "border-black"
                      : "border-transparent hover:border-gray-300"
                  }`}
                >
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="py-2 lg:py-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {product.name}
          </h1>
          <div className="flex items-center gap-3 mt-3">
            {product.on_sale && product.regular_price && (
              <span className="text-lg text-gray-400 line-through">
                ${parseFloat(product.regular_price).toFixed(2)}
              </span>
            )}
            <span className="text-2xl font-semibold text-gray-900">
              ${parseFloat(product.price).toFixed(2)}
            </span>
            {product.on_sale && (
              <span className="text-xs font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                Sale
              </span>
            )}
          </div>

          {/* Description */}
          {product.short_description && (
            <div
              className="mt-6 text-sm text-gray-600 leading-relaxed prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: product.short_description }}
            />
          )}

          {/* Size selector */}
          {sizeAttr && sizeAttr.options.length > 0 && (
            <div className="mt-8">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-3">
                Size
              </label>
              <div className="flex flex-wrap gap-2">
                {sizeAttr.options.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      selectedSize === size
                        ? "bg-black text-white border-black"
                        : "border-gray-200 text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color selector */}
          {colorAttr && colorAttr.options.length > 0 && (
            <div className="mt-6">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-3">
                Color
              </label>
              <div className="flex flex-wrap gap-2">
                {colorAttr.options.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      selectedColor === color
                        ? "bg-black text-white border-black"
                        : "border-gray-200 text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add to cart */}
          <button
            onClick={handleAdd}
            disabled={product.stock_status === "outofstock"}
            className={`mt-8 w-full py-3.5 rounded-full text-sm font-semibold transition-colors ${
              product.stock_status === "outofstock"
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : added
                  ? "bg-green-600 text-white"
                  : "bg-black text-white hover:bg-gray-800"
            }`}
          >
            {product.stock_status === "outofstock"
              ? "Sold Out"
              : added
                ? "Added to Cart!"
                : "Add to Cart"}
          </button>

          {/* Full description */}
          {product.description && (
            <div className="mt-10 pt-8 border-t border-gray-100">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">
                Details
              </h3>
              <div
                className="text-sm text-gray-600 leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
