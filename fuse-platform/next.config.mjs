/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // pg is a native-ish module; keep it server-only.
    serverComponentsExternalPackages: ['pg'],
  },
}
export default nextConfig
