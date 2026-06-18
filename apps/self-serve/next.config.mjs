/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Transpile workspace packages (they ship TypeScript source, not built dist).
  transpilePackages: ["@hio/ui", "@hio/content-model", "@hio/ai-engine", "@hio/db"],
  // Type and lint errors fail the build by default — do NOT disable these.
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: true }, // we use Biome, not ESLint
};

export default nextConfig;
