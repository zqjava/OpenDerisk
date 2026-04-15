import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@antv/gpt-vis'],
  images: {
    unoptimized: true,
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // 生成固定的构建 ID，避免文件名哈希
  generateBuildId: async () => {
    return 'build';
  },
  webpack: (config, { isServer }) => {
    // 配置输出文件名，去掉哈希指纹
    if (!isServer) {
      config.output = config.output || {};
      // JS 文件：去掉哈希，使用原始文件名
      config.output.filename = 'static/js/[name].js';
      config.output.chunkFilename = 'static/js/[name].chunk.js';
      // CSS 文件：去掉哈希
      config.output.assetModuleFilename = 'static/media/[name][ext]';
    }

    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    // Alias @antv/l7-component less to empty CSS to avoid needing less-loader
    const emptyCssPath = path.resolve(__dirname, 'src/styles/empty.css');
    config.resolve.alias = {
      ...config.resolve.alias,
      '@antv/l7-component/es/css/index.less': emptyCssPath,
      [path.resolve(
        __dirname,
        'node_modules/@antv/l7-component/es/css/index.less'
      )]: emptyCssPath,
    };
    return config;
  },
  // Ignore typescript and eslint errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'export',
  trailingSlash: true,
};

export default nextConfig;
