/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Type and lint errors fail the build by default — do NOT disable these.
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: true }, // we use Biome, not ESLint
};

export default nextConfig;
