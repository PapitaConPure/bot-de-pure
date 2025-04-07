import type { NextConfig } from "next";
import createMDX from '@next/mdx';

const withMDX = createMDX({
  extension: /\.mdx?$/,
});

const repoName = 'bot-de-pure';

const nextConfig: NextConfig = {
  output: 'export',
  assetPrefix: process.env.NODE_ENV === 'production' ? `/${repoName}/` : '',
  basePath: process.env.NODE_ENV === 'production' ? `/${repoName}` : '',
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'mdx'],
  images: {
    unoptimized: true,
  },
};

export default withMDX(nextConfig);
