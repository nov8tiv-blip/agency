export const siteConfig = {
  name: "AOG Threads",
  domain: "aogthreads.com",
  tagline: "Wear the Vision",
  description:
    "Premium custom streetwear designed with purpose. Powered by Tapstitch print-on-demand.",
  currency: "USD",
  social: {
    instagram: "",
    tiktok: "",
    twitter: "",
  },
};

export const wooConfig = {
  url: process.env.NEXT_PUBLIC_WOO_URL || "",
  consumerKey: process.env.WOO_CONSUMER_KEY || "",
  consumerSecret: process.env.WOO_CONSUMER_SECRET || "",
};
