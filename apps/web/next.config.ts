import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // TODO: заменить на реальный UploadThing hostname после первой загрузки фото (например "utfs.io" или "<appId>.ufs.sh")
      { protocol: "https", hostname: "YOUR_UPLOADTHING_HOST" },
    ],
  },
};

export default nextConfig;
