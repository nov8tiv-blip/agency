export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
        Our Story
      </h1>
      <div className="mt-8 space-y-6 text-gray-600 leading-relaxed">
        <p>
          AOG Threads was born from a simple belief: what you wear should mean
          something. Every design in our collection is created with intention —
          rooted in culture, self-expression, and the drive to stand out.
        </p>
        <p>
          We partner with Tapstitch for premium print-on-demand fulfillment,
          which means every piece is made to order. No overproduction, no
          waste — just quality streetwear printed and shipped when you order
          it.
        </p>
        <p>
          From heavyweight tees to custom hoodies, each item is crafted on
          premium fabrics with printing techniques built to last. We&apos;re
          not fast fashion — we&apos;re intentional fashion.
        </p>
      </div>

      <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            Premium Materials
          </h3>
          <p className="text-sm text-gray-500">
            High-GSM fabrics that feel as good as they look. Built to hold up
            wash after wash.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            Made to Order
          </h3>
          <p className="text-sm text-gray-500">
            Every item is printed fresh when you order. Zero waste, zero
            compromises.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            Global Delivery
          </h3>
          <p className="text-sm text-gray-500">
            Shipped worldwide through Tapstitch&apos;s fulfillment network.
            Tracking included on every order.
          </p>
        </div>
      </div>
    </div>
  );
}
