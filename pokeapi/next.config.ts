/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com', // 👈 เพิ่ม Hostname นี้สำหรับรูปสำรอง
      },
      // --- ของเดิมที่เคยเพิ่มไว้ ---
      {
        protocol: 'https',
        hostname: 'images.api-onepiece.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'brunosouzadev-dinoapi.s3.sa-east-1.amazonaws.com',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
    ],
  },
};

module.exports = nextConfig;