/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'utfs.io',
        port: ''
      },
      {
        protocol: 'https',
        hostname: 'api.slingacademy.com',
        port: ''
      },
      {
        protocol: 'https',
        hostname: 'd14ti7ztt9zv5f.cloudfront.net',
        pathname: '/**'
      },
      { protocol: 'https', hostname: 'dub.co', pathname: '/**' },
      { protocol: 'https', hostname: 'dub.sh', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'amazonaws.com', pathname: '/**' },
      { protocol: 'https', hostname: 'example.com', pathname: '/**' },
      {
        protocol: 'https',
        hostname: 'make-movie-dev.s3.us-east-2.amazonaws.com',
        pathname: '/**'
      },
      { protocol: 'https', hostname: 'images.pexels.com', pathname: '/**' },
      {
        protocol: 'https',
        hostname: 'abdul-hadi-dev.s3.us-east-2.amazonaws.com',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'avatar.iran.liara.run',
        pathname: '/public/boy'
      },
      {
        protocol: 'https',
        hostname: 'images.tpointtech.com',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'media.istockphoto.com',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'purisconsulting.com',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'static.vecteezy.com',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'yes-jobs-dev.s3.ap-southeast-2.amazonaws.com',
        pathname: '/**'
      }
    ]
  },
  async rewrites() {
    const API_URL =
      process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3030';

    return [
      {
        source: '/api/:path*',
        destination: `${API_URL}/api/:path*`
      }
    ];
  },
  transpilePackages: ['geist']
};

module.exports = nextConfig;
