import Link from "next/link";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gray-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 sm:py-44 relative z-10">
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight leading-[1.05]">
            Wear the
            <br />
            <span className="text-gray-400">Vision.</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-400 max-w-lg">
            Premium custom streetwear designed with purpose. Every piece tells a
            story.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/shop"
              className="inline-flex items-center px-8 py-3.5 bg-white text-black text-sm font-semibold rounded-full hover:bg-gray-200 transition-colors"
            >
              Shop Now
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center px-8 py-3.5 border border-gray-600 text-gray-300 text-sm font-medium rounded-full hover:border-white hover:text-white transition-colors"
            >
              Our Story
            </Link>
          </div>
        </div>

        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 text-center">
          <div>
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Premium Quality
            </h3>
            <p className="text-sm text-gray-500">
              High-quality fabrics and printing that lasts.
            </p>
          </div>
          <div>
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Made to Order
            </h3>
            <p className="text-sm text-gray-500">
              Zero waste. Every piece is printed just for you.
            </p>
          </div>
          <div>
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Worldwide Shipping
            </h3>
            <p className="text-sm text-gray-500">
              Delivered to your door, wherever you are.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
            Ready to rep the vision?
          </h2>
          <p className="mt-4 text-gray-500 max-w-md mx-auto">
            Browse the collection and find your next favorite piece.
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-flex items-center px-8 py-3.5 bg-black text-white text-sm font-semibold rounded-full hover:bg-gray-800 transition-colors"
          >
            Browse Collection
          </Link>
        </div>
      </section>
    </>
  );
}
