import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/crm", destination: "/clients", permanent: true },
      { source: "/crm/:path*", destination: "/clients/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
